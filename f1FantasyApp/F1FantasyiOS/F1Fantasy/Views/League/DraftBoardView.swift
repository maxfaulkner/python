import SwiftUI

// MARK: - Models

struct DraftState: Decodable {
    let started: Bool
    let picks: [DraftPick]
    let order: [DraftParticipant]?
    let startedAt: String?
}

struct DraftPick: Decodable, Identifiable {
    var id: Int { pick }
    let userId: String
    let type: String        // "driver" | "constructor"
    let itemId: String
    let itemName: String
    let round: Int
    let pick: Int
    let pickedAt: String
}

struct DraftParticipant: Decodable, Identifiable {
    var id: String { userId }
    let userId: String
    let name: String
}

// MARK: - ViewModel

@Observable
final class DraftBoardViewModel {
    var state: DraftState?
    var isLoading = false
    var errorMessage: String?
    var selectedItemId: String?
    var selectedItemType: String = "driver"
    var isSubmittingPick = false
    var currentUserId: String?
    var prices: PricesResponse?

    private var pollTask: Task<Void, Never>?
    private let leagueId: String

    init(leagueId: String) { self.leagueId = leagueId }

    var isMyTurn: Bool {
        guard let state, state.started, let order = state.order else { return false }
        let n = order.count
        guard n > 0 else { return false }
        let totalPicks = n * 6
        let currentIdx = state.picks.count
        guard currentIdx < totalPicks else { return false }
        let snakeIdx = currentIdx / n % 2 == 0 ? currentIdx % n : n - 1 - (currentIdx % n)
        return order[snakeIdx].userId == currentUserId
    }

    var currentPickerName: String? {
        guard let state, let order = state.order, !order.isEmpty else { return nil }
        let n = order.count
        let currentIdx = state.picks.count
        guard currentIdx < n * 6 else { return nil }
        let snakeIdx = currentIdx / n % 2 == 0 ? currentIdx % n : n - 1 - (currentIdx % n)
        return order[snakeIdx].name
    }

    var alreadyPickedIds: Set<String> { Set(state?.picks.map { $0.itemId } ?? []) }

    func load() async {
        isLoading = true
        errorMessage = nil
        async let stateResult: DraftState = APIClient.shared.request("GET", path: "/api/leagues/\(leagueId)/draft")
        async let pricesResult: PricesResponse? = {
            try? await APIClient.shared.request("GET", path: "/api/leagues/\(leagueId)/prices/1") as PricesResponse
        }()
        do {
            state = try await stateResult
            prices = await pricesResult
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    func makePick() async {
        guard let itemId = selectedItemId else { return }
        isSubmittingPick = true
        struct PickBody: Encodable { let type: String; let itemId: String; let itemName: String }
        let itemName: String
        if selectedItemType == "driver" {
            itemName = prices?.drivers.first(where: { $0.driverId == itemId })?.driver?.name ?? itemId
        } else {
            itemName = prices?.constructors.first(where: { $0.constructorId == itemId })?.constructor?.name ?? itemId
        }
        do {
            state = try await APIClient.shared.request(
                "POST", path: "/api/leagues/\(leagueId)/draft/pick",
                body: PickBody(type: selectedItemType, itemId: itemId, itemName: itemName)
            )
            selectedItemId = nil
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isSubmittingPick = false
    }

    func startPolling() {
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                do {
                    try await Task.sleep(for: .seconds(5))
                    if !Task.isCancelled { await load() }
                } catch { break }
            }
        }
    }

    func stopPolling() { pollTask?.cancel(); pollTask = nil }
}

// MARK: - View

struct DraftBoardView: View {
    let leagueId: String
    let currentUserId: String
    @State private var vm: DraftBoardViewModel

    init(leagueId: String, currentUserId: String) {
        self.leagueId = leagueId
        self.currentUserId = currentUserId
        _vm = State(initialValue: DraftBoardViewModel(leagueId: leagueId))
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            if vm.isLoading && vm.state == nil { LoadingView() }
            else if let err = vm.errorMessage, vm.state == nil {
                ErrorView(message: err) { Task { await vm.load() } }
            } else if vm.state?.started == false {
                VStack(spacing: 12) {
                    Text("🏎").font(.system(size: 48))
                    Text("Draft not started yet").font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                    Text("The commissioner will start the draft when everyone is ready.")
                        .font(.caption).foregroundStyle(.appTextDim).multilineTextAlignment(.center)
                }
                .padding(32)
            } else {
                draftContent
            }
        }
        .navigationTitle("Draft Board")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            vm.currentUserId = currentUserId
            await vm.load()
            vm.startPolling()
        }
        .onDisappear { vm.stopPolling() }
    }

    private var draftContent: some View {
        VStack(spacing: 0) {
            // Status banner
            if let picker = vm.currentPickerName {
                HStack(spacing: 8) {
                    if vm.isMyTurn {
                        Image(systemName: "arrow.right.circle.fill").foregroundStyle(.appGold)
                        Text("Your turn to pick!")
                            .font(.subheadline).fontWeight(.bold).foregroundStyle(.appGold)
                    } else {
                        ProgressView().scaleEffect(0.7)
                        Text("\(picker) is picking…")
                            .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(12)
                .background(vm.isMyTurn ? Color.appGold.opacity(0.1) : Color.appCard)
            }

            // Pick history + (if my turn) picker
            ScrollView {
                VStack(spacing: 12) {
                    if vm.isMyTurn { pickSelector }
                    pickHistory
                }
                .padding(.bottom, 32)
            }
        }
    }

    private var pickSelector: some View {
        VStack(spacing: 8) {
            Picker("", selection: $vm.selectedItemType) {
                Text("Drivers").tag("driver")
                Text("Constructors").tag("constructor")
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)

            let availableDrivers = (vm.prices?.drivers ?? []).filter { !vm.alreadyPickedIds.contains($0.driverId) }
            let availableCtors = (vm.prices?.constructors ?? []).filter { !vm.alreadyPickedIds.contains($0.constructorId) }

            if vm.selectedItemType == "driver" {
                ForEach(availableDrivers) { entry in
                    pickRow(id: entry.driverId, name: entry.driver?.name ?? "Unknown",
                            subtitle: entry.driver?.constructor?.name ?? "", color: constructorColor(for: entry.driver?.constructor?.name))
                }
            } else {
                ForEach(availableCtors) { entry in
                    pickRow(id: entry.constructorId, name: entry.constructor?.name ?? "Unknown",
                            subtitle: entry.constructor?.nationality ?? "", color: constructorColor(for: entry.constructor?.name))
                }
            }

            Button {
                Task { await vm.makePick() }
            } label: {
                HStack {
                    if vm.isSubmittingPick { ProgressView().tint(.white) }
                    else { Text("Confirm Pick").fontWeight(.bold) }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 46)
                .background(vm.selectedItemId != nil ? Color.appRed : Color.appCard)
                .foregroundStyle(vm.selectedItemId != nil ? .white : .appTextDim)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
            .disabled(vm.selectedItemId == nil || vm.isSubmittingPick)
            .padding(.horizontal)
        }
        .padding()
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appGold.opacity(0.3), lineWidth: 1))
        .padding(.horizontal)
    }

    private func pickRow(id: String, name: String, subtitle: String, color: Color) -> some View {
        Button {
            vm.selectedItemId = vm.selectedItemId == id ? nil : id
        } label: {
            HStack(spacing: 12) {
                RoundedRectangle(cornerRadius: 2).fill(color).frame(width: 3, height: 36)
                VStack(alignment: .leading, spacing: 2) {
                    Text(name).font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                    Text(subtitle).font(.caption2).foregroundStyle(.appTextDim)
                }
                Spacer()
                if vm.selectedItemId == id {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.appRed)
                }
            }
            .padding(.horizontal, 14).padding(.vertical, 10)
            .background(vm.selectedItemId == id ? Color.appRed.opacity(0.08) : Color.clear)
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }

    private var pickHistory: some View {
        let picks = vm.state?.picks ?? []
        let byRound = Dictionary(grouping: picks) { $0.round }
        let rounds = byRound.keys.sorted(by: >)
        return VStack(spacing: 8) {
            ForEach(rounds, id: \.self) { round in
                VStack(spacing: 0) {
                    Text("Round \(round)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.appTextFaint)
                        .textCase(.uppercase)
                        .tracking(0.5)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 14).padding(.vertical, 8)
                    ForEach(byRound[round] ?? []) { pick in
                        HStack(spacing: 12) {
                            Text("#\(pick.pick)").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextFaint).frame(width: 28, alignment: .center)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(pick.itemName).font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                                Text(pick.type.capitalized).font(.caption2).foregroundStyle(.appTextDim)
                            }
                            Spacer()
                            let participantName = vm.state?.order?.first(where: { $0.userId == pick.userId })?.name ?? "Unknown"
                            Text(participantName).font(.caption2).foregroundStyle(.appTextDim)
                        }
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .background(pick.userId == currentUserId ? Color.appRed.opacity(0.06) : Color.clear)
                    }
                }
                .background(Color.appCard)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
            }
        }
    }
}
