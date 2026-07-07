import SwiftUI

// MARK: - ViewModel

@Observable
final class TeamHistoryViewModel {
    var rounds: [TeamHistoryRound] = []
    var isLoading = false
    var errorMessage: String?

    func load(leagueId: String, latestWeek: Int) async {
        isLoading = true
        errorMessage = nil
        var fetched: [TeamHistoryRound] = []

        await withTaskGroup(of: TeamHistoryRound?.self) { group in
            for week in 1...max(1, latestWeek) {
                group.addTask {
                    guard let team: WeeklyTeam = try? await APIClient.shared.request(
                        "GET", path: "/api/leagues/\(leagueId)/team/\(week)"
                    ) else { return nil }
                    return TeamHistoryRound(week: week, team: team)
                }
            }
            for await result in group {
                if let round = result { fetched.append(round) }
            }
        }

        rounds = fetched.sorted { $0.week < $1.week }
        isLoading = false
    }
}

struct TeamHistoryRound: Identifiable {
    var id: Int { week }
    let week: Int
    let team: WeeklyTeam
}

// MARK: - View

struct TeamHistoryView: View {
    let leagueId: String
    let latestWeek: Int
    @State private var vm = TeamHistoryViewModel()

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            if vm.isLoading { LoadingView() }
            else if let err = vm.errorMessage { ErrorView(message: err) { Task { await vm.load(leagueId: leagueId, latestWeek: latestWeek) } } }
            else if vm.rounds.isEmpty {
                VStack(spacing: 12) {
                    Text("📋").font(.system(size: 48))
                    Text("No past picks yet").font(.subheadline).foregroundStyle(.appTextDim)
                }
            } else {
                content
            }
        }
        .navigationTitle("Team History")
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load(leagueId: leagueId, latestWeek: latestWeek) }
    }

    private var content: some View {
        ScrollView {
            LazyVStack(spacing: 0) {
                ForEach(vm.rounds) { round in
                    HistoryRoundSection(round: round)
                }
            }
            .padding(.bottom, 32)
        }
    }
}

struct HistoryRoundSection: View {
    let round: TeamHistoryRound

    private var totalPoints: Int { round.team.totalRoundPoints ?? 0 }

    var body: some View {
        VStack(spacing: 0) {
            // Round header
            HStack {
                HStack(spacing: 8) {
                    Text("R\(round.week)")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.white)
                        .frame(width: 30, height: 30)
                        .background(Color.appRed)
                        .clipShape(Circle())
                    Text("Round \(round.week)")
                        .font(.subheadline).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                    if let chip = round.team.chipUsed {
                        Text(chipEmoji(chip))
                            .font(.caption)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(Color.appGold.opacity(0.2))
                            .clipShape(Capsule())
                    }
                }
                Spacer()
                if totalPoints != 0 {
                    Text(totalPoints > 0 ? "+\(totalPoints)" : "\(totalPoints)")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(totalPoints > 0 ? Color.appSuccess : Color.appError)
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 10)
            .background(Color.appCard)

            // Drivers
            ForEach(round.team.drivers) { driver in
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(constructorColor(for: driver.driver?.constructor?.name))
                        .frame(width: 3, height: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 6) {
                            Text(driver.driver?.name ?? "Unknown")
                                .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                            if round.team.captainId == driver.driverId {
                                Text("C")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundStyle(.black)
                                    .frame(width: 16, height: 16)
                                    .background(Color.appGold)
                                    .clipShape(Circle())
                            }
                        }
                        Text(driver.driver?.constructor?.name ?? "")
                            .font(.caption2).foregroundStyle(.appTextDim)
                    }
                    Spacer()
                    if let pts = driver.roundPoints {
                        Text(pts > 0 ? "+\(pts)" : "\(pts)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(pts > 0 ? .appSuccess : pts < 0 ? .appError : .appTextFaint)
                    }
                }
                .padding(.horizontal, 16).padding(.vertical, 8)
                .background(Color.appCard.opacity(0.6))
                Color.appBorder.frame(height: 0.5).padding(.leading, 16)
            }

            // Constructor
            if let ctor = round.team.constructors.first {
                HStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(constructorColor(for: ctor.constructor?.name))
                        .frame(width: 3, height: 36)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ctor.constructor?.name ?? "Unknown")
                            .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                        Text("Constructor")
                            .font(.caption2).foregroundStyle(.appRed)
                    }
                    Spacer()
                    if let pts = ctor.roundPoints {
                        Text(pts > 0 ? "+\(pts)" : "\(pts)")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(pts > 0 ? .appSuccess : pts < 0 ? .appError : .appTextFaint)
                    }
                }
                .padding(.horizontal, 16).padding(.vertical, 8)
                .background(Color.appCard.opacity(0.6))
            }

            Color.appBorder.frame(height: 6)
        }
    }
}
