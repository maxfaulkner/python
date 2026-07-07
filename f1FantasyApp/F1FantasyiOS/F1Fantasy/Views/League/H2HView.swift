import SwiftUI

// MARK: - Models

struct H2HMatchup: Decodable, Identifiable {
    let id: String
    let week: Int
    let user1Id: String
    let user2Id: String
    let user1Points: Int
    let user2Points: Int
    let winnerId: String?
    let user1: H2HUser?
    let user2: H2HUser?
}

struct H2HUser: Decodable {
    let id: String
    let name: String
    let avatarColor: String?
    let teamName: String?
}

struct H2HRecord: Decodable, Identifiable {
    let userId: String
    var id: String { userId }
    let name: String?
    let avatarColor: String?
    let wins: Int
    let losses: Int
    let draws: Int
    let played: Int
    let pts: Int
}

struct H2HResponse: Decodable {
    let matchups: [H2HMatchup]
    let records: [String: H2HRecord]
}

// MARK: - ViewModel

@Observable
final class H2HViewModel {
    var matchups: [H2HMatchup] = []
    var records: [H2HRecord] = []
    var isLoading = false
    var errorMessage: String?
    var selectedWeek: Int? = nil

    var weeks: [Int] { Array(Set(matchups.map { $0.week })).sorted(by: >) }
    var displayedMatchups: [H2HMatchup] {
        guard let w = selectedWeek else { return matchups }
        return matchups.filter { $0.week == w }
    }

    func load(leagueId: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let response: H2HResponse = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/h2h"
            )
            matchups = response.matchups
            records = Array(response.records.values).sorted { $0.wins > $1.wins }
            selectedWeek = weeks.first
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }
}

// MARK: - View

struct H2HView: View {
    let leagueId: String
    @State private var vm = H2HViewModel()
    @State private var showRecords = false

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            if vm.isLoading { LoadingView() }
            else if let err = vm.errorMessage { ErrorView(message: err) { Task { await vm.load(leagueId: leagueId) } } }
            else if vm.matchups.isEmpty {
                VStack(spacing: 12) {
                    Text("⚔️").font(.system(size: 48))
                    Text("No matchups yet").font(.subheadline).foregroundStyle(.appTextDim)
                    Text("Matchups are generated after each race.").font(.caption).foregroundStyle(.appTextFaint).multilineTextAlignment(.center)
                }
                .padding(32)
            } else {
                content
            }
        }
        .task { await vm.load(leagueId: leagueId) }
        .refreshable { await vm.load(leagueId: leagueId) }
    }

    private var content: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Season records vs round matchups toggle
                Picker("", selection: $showRecords) {
                    Text("Matchups").tag(false)
                    Text("Season Table").tag(true)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                if showRecords {
                    seasonRecords
                } else {
                    // Week selector
                    if !vm.weeks.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(vm.weeks, id: \.self) { week in
                                    Button("R\(week)") { vm.selectedWeek = week }
                                        .font(.system(size: 11, weight: .bold))
                                        .padding(.horizontal, 12).padding(.vertical, 6)
                                        .background(vm.selectedWeek == week ? Color.appRed : Color.appCard)
                                        .foregroundStyle(vm.selectedWeek == week ? .white : .appTextDim)
                                        .clipShape(Capsule())
                                        .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    matchupList
                }
            }
            .padding(.bottom, 32)
        }
    }

    private var matchupList: some View {
        VStack(spacing: 8) {
            ForEach(vm.displayedMatchups) { matchup in
                MatchupCard(matchup: matchup)
                    .padding(.horizontal)
            }
        }
    }

    private var seasonRecords: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Player").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextFaint).frame(maxWidth: .infinity, alignment: .leading)
                Text("W").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextFaint).frame(width: 32, alignment: .center)
                Text("D").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextFaint).frame(width: 32, alignment: .center)
                Text("L").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextFaint).frame(width: 32, alignment: .center)
                Text("Pts").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextFaint).frame(width: 44, alignment: .trailing)
            }
            .padding(.horizontal, 14).padding(.vertical, 8)
            .background(Color.appCard)

            ForEach(Array(vm.records.enumerated()), id: \.element.id) { i, record in
                HStack {
                    HStack(spacing: 8) {
                        Text("\(i + 1)").font(.caption2).fontWeight(.bold).foregroundStyle(.appTextDim).frame(width: 16)
                        AvatarView(name: record.name ?? "?", colorHex: record.avatarColor ?? "e10600", size: 28)
                        Text(record.name ?? "Unknown").font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary).lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text("\(record.wins)").font(.subheadline).fontWeight(.bold).foregroundStyle(.appSuccess).frame(width: 32, alignment: .center)
                    Text("\(record.draws)").font(.subheadline).foregroundStyle(.appTextDim).frame(width: 32, alignment: .center)
                    Text("\(record.losses)").font(.subheadline).fontWeight(.bold).foregroundStyle(.appError).frame(width: 32, alignment: .center)
                    Text("\(record.pts)").font(.subheadline).fontWeight(.bold).foregroundStyle(.appTextPrimary).frame(width: 44, alignment: .trailing)
                }
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(Color.appCard)
                if i < vm.records.count - 1 {
                    Color.appBorder.frame(height: 0.5).padding(.horizontal, 14)
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
}

// MARK: - Matchup Card

struct MatchupCard: View {
    let matchup: H2HMatchup

    private var user1Won: Bool { matchup.winnerId == matchup.user1Id }
    private var user2Won: Bool { matchup.winnerId == matchup.user2Id }
    private var isDraw: Bool { matchup.winnerId == "draw" }

    var body: some View {
        HStack(spacing: 0) {
            // User 1
            VStack(spacing: 6) {
                AvatarView(name: matchup.user1?.name ?? "?", colorHex: matchup.user1?.avatarColor ?? "e10600", size: 36)
                Text(matchup.user1?.name ?? "Unknown")
                    .font(.caption2).fontWeight(.semibold).foregroundStyle(.appTextPrimary).lineLimit(1)
                if let team = matchup.user1?.teamName {
                    Text(team).font(.system(size: 9)).foregroundStyle(.appTextDim).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(user1Won ? Color.appSuccess.opacity(0.06) : Color.clear)

            // Scores
            VStack(spacing: 4) {
                HStack(spacing: 8) {
                    Text("\(matchup.user1Points)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundStyle(user1Won ? .appSuccess : .appTextPrimary)
                    Text("–")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.appTextFaint)
                    Text("\(matchup.user2Points)")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundStyle(user2Won ? .appSuccess : .appTextPrimary)
                }
                Text(isDraw ? "Draw" : matchup.winnerId != nil ? "Final" : "Pending")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(isDraw ? .appGold : matchup.winnerId != nil ? .appSuccess : .appTextFaint)
                    .textCase(.uppercase)
                    .tracking(0.5)
            }
            .frame(width: 100)

            // User 2
            VStack(spacing: 6) {
                AvatarView(name: matchup.user2?.name ?? "?", colorHex: matchup.user2?.avatarColor ?? "e10600", size: 36)
                Text(matchup.user2?.name ?? "Unknown")
                    .font(.caption2).fontWeight(.semibold).foregroundStyle(.appTextPrimary).lineLimit(1)
                if let team = matchup.user2?.teamName {
                    Text(team).font(.system(size: 9)).foregroundStyle(.appTextDim).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(user2Won ? Color.appSuccess.opacity(0.06) : Color.clear)
        }
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder, lineWidth: 1))
    }
}
