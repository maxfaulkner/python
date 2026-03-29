import SwiftUI

struct LeaderboardView: View {
    let leagueId: String
    @Binding var currentWeek: Int
    @State private var vm = LeaderboardViewModel()
    @State private var selectedUserId: String?

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            Group {
                if vm.isLoading && vm.seasonStandings.isEmpty { LoadingView() }
                else if let err = vm.errorMessage { ErrorView(message: err) { Task { await vm.load(leagueId: leagueId) } } }
                else { content }
            }
        }
        .task {
            await vm.load(leagueId: leagueId)
            if let week = vm.latestRound { currentWeek = week }
        }
        .refreshable { await vm.load(leagueId: leagueId) }
    }

    private var content: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Mode picker
                Picker("View", selection: $vm.viewMode) {
                    Text("Season").tag(LeaderboardViewModel.ViewMode.season)
                    Text("Round \(currentWeek)").tag(LeaderboardViewModel.ViewMode.weekly)
                }
                .pickerStyle(.segmented)
                .padding()
                .onChange(of: vm.viewMode) { _, mode in
                    if mode == .weekly { Task { await vm.loadWeekly(leagueId: leagueId, week: currentWeek) } }
                }

                // Podium (season only)
                if vm.viewMode == .season && vm.podium.count >= 3 {
                    PodiumView(podium: vm.podium)
                        .padding(.horizontal)
                        .padding(.bottom, 8)
                }

                if vm.viewMode == .season {
                    ForEach(Array(vm.seasonStandings.dropFirst(vm.podium.count >= 3 ? 3 : 0))) { entry in
                        StandingRowView(entry: entry)
                            .padding(.horizontal)
                            .padding(.vertical, 6)
                    }
                } else {
                    ForEach(vm.weeklyStandings) { entry in
                        WeeklyStandingRow(entry: entry)
                            .padding(.horizontal)
                            .padding(.vertical, 6)
                    }
                }
            }
        }
    }
}

struct PodiumView: View {
    let podium: [LeaderboardEntry]

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            // 2nd
            if podium.count > 1 { podiumCard(entry: podium[1], position: 2, height: 80) }
            // 1st
            if !podium.isEmpty { podiumCard(entry: podium[0], position: 1, height: 100) }
            // 3rd
            if podium.count > 2 { podiumCard(entry: podium[2], position: 3, height: 65) }
        }
        .padding(.vertical, 8)
    }

    private func podiumCard(entry: LeaderboardEntry, position: Int, height: CGFloat) -> some View {
        VStack(spacing: 6) {
            if position == 1 {
                Image(systemName: "crown.fill").foregroundStyle(.appGold).font(.caption)
            }
            AvatarView(name: entry.userName, colorHex: entry.avatarColor ?? "e10600", size: position == 1 ? 44 : 36)
            Text(entry.userName.components(separatedBy: " ").first ?? entry.userName)
                .font(.caption2).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                .lineLimit(1)
            Text("\(entry.totalPoints)").font(.caption2).foregroundStyle(.appTextDim)
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

struct StandingRowView: View {
    let entry: LeaderboardEntry

    var body: some View {
        HStack(spacing: 12) {
            Text("\(entry.rank)")
                .font(.headline).fontWeight(.bold).foregroundStyle(.appTextDim)
                .frame(width: 28, alignment: .center)
            AvatarView(name: entry.userName, colorHex: entry.avatarColor ?? "e10600")
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.userName).font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                if let teamName = entry.teamName { Text(teamName).font(.caption2).foregroundStyle(.appTextDim) }
            }
            Spacer()
            if let delta = entry.rankDelta { RankDeltaBadge(delta: delta) }
            Text("\(entry.totalPoints)")
                .font(.headline).fontWeight(.bold).foregroundStyle(.appTextPrimary)
        }
        .padding(12)
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

struct WeeklyStandingRow: View {
    let entry: WeeklyLeaderboardEntry

    var body: some View {
        HStack(spacing: 12) {
            Text("\(entry.rank)").font(.headline).fontWeight(.bold).foregroundStyle(.appTextDim).frame(width: 28)
            AvatarView(name: entry.userName, colorHex: entry.avatarColor ?? "e10600")
            Text(entry.userName).font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
            Spacer()
            if let chip = entry.chipUsed { Text(chipEmoji(chip)).font(.body) }
            Text("\(entry.points)").font(.headline).fontWeight(.bold).foregroundStyle(.appTextPrimary)
        }
        .padding(12)
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}