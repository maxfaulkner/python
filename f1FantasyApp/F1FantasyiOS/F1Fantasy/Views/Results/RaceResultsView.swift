import SwiftUI

@Observable
final class RaceResultsViewModel {
    var results: RaceResultsResponse?
    var latestWeek: Int?
    var browseWeek: Int = 1
    var isLoading = false
    var errorMessage: String?
    var activeTab = 0  // 0 = drivers, 1 = constructors

    func loadLatest() async {
        isLoading = true
        errorMessage = nil
        do {
            let response: RaceResultsResponse = try await APIClient.shared.request(
                "GET", path: "/api/results/latest"
            )
            results = response
            latestWeek = response.week
            browseWeek = response.week
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    func loadWeek(_ week: Int) async {
        isLoading = true
        errorMessage = nil
        do {
            let response: RaceResultsResponse = try await APIClient.shared.request(
                "GET", path: "/api/results/\(week)"
            )
            results = response
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }
}

struct RaceResultsView: View {
    @State private var vm = RaceResultsViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()
                Group {
                    if vm.isLoading && vm.results == nil { LoadingView() }
                    else if let err = vm.errorMessage, vm.results == nil {
                        ErrorView(message: err) { Task { await vm.loadLatest() } }
                    } else if let results = vm.results {
                        content(results)
                    } else {
                        VStack(spacing: 12) {
                            Text("🏁").font(.system(size: 48))
                            Text("No results yet").font(.subheadline).foregroundStyle(.appTextDim)
                            Text("Results will appear here after each race.")
                                .font(.caption).foregroundStyle(.appTextFaint)
                                .multilineTextAlignment(.center)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
            .navigationTitle("Results")
            .task { await vm.loadLatest() }
            .refreshable { await vm.loadLatest() }
        }
    }

    private func content(_ results: RaceResultsResponse) -> some View {
        ScrollView {
            VStack(spacing: 12) {
                // Week navigator
                weekNavigator

                // Sprint badge
                if results.drivers.first?.isSprint == true {
                    HStack(spacing: 6) {
                        Image(systemName: "bolt.fill").font(.caption2)
                        Text("Sprint Race").font(.caption).fontWeight(.semibold)
                    }
                    .foregroundStyle(.appGold)
                    .padding(.horizontal, 10).padding(.vertical, 5)
                    .background(Color.appGold.opacity(0.12))
                    .clipShape(Capsule())
                }

                // Podium
                if results.drivers.count >= 3 {
                    ResultPodiumView(top3: Array(results.drivers.prefix(3)))
                        .padding(.horizontal, 16)
                }

                // Tab toggle
                Picker("", selection: $vm.activeTab) {
                    Text("Drivers").tag(0)
                    Text("Constructors").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal, 16)

                // Results list
                if vm.activeTab == 0 {
                    VStack(spacing: 0) {
                        ForEach(Array(results.drivers.enumerated()), id: \.element.id) { i, entry in
                            DriverResultRow(entry: entry)
                            if i < results.drivers.count - 1 {
                                Color.appBorder.frame(height: 0.5).padding(.leading, 56)
                            }
                        }
                    }
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 16)
                } else {
                    VStack(spacing: 0) {
                        ForEach(Array(results.constructors.enumerated()), id: \.element.id) { i, entry in
                            ConstructorResultRow(position: i + 1, entry: entry)
                            if i < results.constructors.count - 1 {
                                Color.appBorder.frame(height: 0.5).padding(.leading, 56)
                            }
                        }
                    }
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 16)
                }

                Spacer(minLength: 32)
            }
            .padding(.top, 12)
        }
    }

    private var weekNavigator: some View {
        HStack {
            Button {
                if vm.browseWeek > 1 {
                    vm.browseWeek -= 1
                    Task { await vm.loadWeek(vm.browseWeek) }
                }
            } label: {
                Image(systemName: "chevron.left").font(.headline)
                    .foregroundStyle(vm.browseWeek > 1 ? .appTextPrimary : .appTextFaint)
            }
            .disabled(vm.browseWeek <= 1)

            Spacer()
            VStack(spacing: 2) {
                Text("ROUND").font(.system(size: 10, weight: .bold)).foregroundStyle(.appTextDim)
                Text("\(vm.browseWeek)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.appTextPrimary)
                if vm.isLoading { ProgressView().scaleEffect(0.6) }
            }
            Spacer()

            Button {
                if let latest = vm.latestWeek, vm.browseWeek < latest {
                    vm.browseWeek += 1
                    Task { await vm.loadWeek(vm.browseWeek) }
                }
            } label: {
                Image(systemName: "chevron.right").font(.headline)
                    .foregroundStyle((vm.latestWeek.map { vm.browseWeek < $0 } ?? false) ? .appTextPrimary : .appTextFaint)
            }
            .disabled(vm.latestWeek.map { vm.browseWeek >= $0 } ?? true)
        }
        .padding(.horizontal, 32).padding(.vertical, 8)
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 16)
    }
}

// MARK: - Podium

struct ResultPodiumView: View {
    let top3: [DriverResult]

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            podiumCard(top3[1], position: 2, height: 70)
            podiumCard(top3[0], position: 1, height: 90)
            podiumCard(top3[2], position: 3, height: 55)
        }
    }

    private func podiumCard(_ entry: DriverResult, position: Int, height: CGFloat) -> some View {
        VStack(spacing: 6) {
            if position == 1 {
                Image(systemName: "crown.fill").foregroundStyle(.appGold).font(.caption)
            }
            Circle()
                .fill(constructorColor(for: entry.driver.constructor?.name))
                .frame(width: position == 1 ? 44 : 36, height: position == 1 ? 44 : 36)
                .overlay(
                    Text(entry.driver.abbr ?? String(entry.driver.name.prefix(3)).uppercased())
                        .font(.system(size: position == 1 ? 11 : 9, weight: .bold))
                        .foregroundStyle(.white)
                )
            Text(entry.driver.name.components(separatedBy: " ").last ?? entry.driver.name)
                .font(.caption2).fontWeight(.semibold).foregroundStyle(.appTextPrimary).lineLimit(1)
            Text(entry.driver.constructor?.name ?? "")
                .font(.system(size: 9)).foregroundStyle(.appTextDim).lineLimit(1)
            Text("+\(entry.points) pts").font(.system(size: 10, weight: .bold)).foregroundStyle(.appGold)
            RoundedRectangle(cornerRadius: 6)
                .fill(position == 1 ? Color.appGold.opacity(0.2) : Color.appCard)
                .frame(height: height)
                .overlay(
                    Text("P\(position)").font(.title3).fontWeight(.bold)
                        .foregroundStyle(position == 1 ? .appGold : position == 2 ? Color(hex: "C0C0C0") : Color(hex: "CD7F32"))
                )
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Driver row

struct DriverResultRow: View {
    let entry: DriverResult

    private var positionColor: Color {
        switch entry.position {
        case 1: return .appGold
        case 2: return Color(hex: "C0C0C0")
        case 3: return Color(hex: "CD7F32")
        default: return .appTextDim
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Text("\(entry.position)")
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(positionColor)
                .frame(width: 28, alignment: .center)

            RoundedRectangle(cornerRadius: 2)
                .fill(constructorColor(for: entry.driver.constructor?.name))
                .frame(width: 3, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.driver.name)
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                Text(entry.driver.constructor?.name ?? "")
                    .font(.caption2).foregroundStyle(.appTextDim)
            }

            Spacer()

            // Grid position delta
            if let delta = entry.positionDelta, delta != 0 {
                HStack(spacing: 2) {
                    Image(systemName: delta > 0 ? "arrow.up" : "arrow.down")
                        .font(.system(size: 9, weight: .bold))
                    Text("\(abs(delta))").font(.system(size: 10, weight: .bold))
                }
                .foregroundStyle(delta > 0 ? Color.appSuccess : Color.appError)
                .padding(.horizontal, 5).padding(.vertical, 2)
                .background(delta > 0 ? Color.appSuccess.opacity(0.12) : Color.appError.opacity(0.12))
                .clipShape(Capsule())
            }

            Text(entry.points > 0 ? "+\(entry.points)" : "\(entry.points)")
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(entry.points > 0 ? .appTextPrimary : .appTextFaint)
                .frame(width: 42, alignment: .trailing)
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
    }
}

// MARK: - Constructor row

struct ConstructorResultRow: View {
    let position: Int
    let entry: ConstructorResult

    var body: some View {
        HStack(spacing: 12) {
            Text("\(position)")
                .font(.system(size: 14, weight: .bold)).foregroundStyle(.appTextDim)
                .frame(width: 28, alignment: .center)

            RoundedRectangle(cornerRadius: 2)
                .fill(constructorColor(for: entry.constructor.name))
                .frame(width: 3, height: 36)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.constructor.name)
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                Text(entry.constructor.nationality ?? "")
                    .font(.caption2).foregroundStyle(.appTextDim)
            }

            Spacer()

            Text("+\(entry.points)")
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundStyle(.appTextPrimary)
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
    }
}
