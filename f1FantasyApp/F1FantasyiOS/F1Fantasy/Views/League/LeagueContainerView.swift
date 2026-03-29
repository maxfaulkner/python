import SwiftUI

struct LeagueContainerView: View {
    let league: League
    @State private var selectedTab = 0
    @State private var currentWeek: Int = 1

    var body: some View {
        TabView(selection: $selectedTab) {
            LeagueHomeView(league: league, currentWeek: $currentWeek)
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(0)

            LeaderboardView(leagueId: league.id, currentWeek: $currentWeek)
                .tabItem { Label("Standings", systemImage: "list.number") }
                .tag(1)

            TeamPickerView(leagueId: league.id, week: currentWeek)
                .tabItem { Label("Team", systemImage: "person.3.fill") }
                .tag(2)

            StatsView(leagueId: league.id, currentWeek: currentWeek)
                .tabItem { Label("Stats", systemImage: "chart.line.uptrend.xyaxis") }
                .tag(3)

            ChatView(leagueId: league.id)
                .tabItem { Label("Chat", systemImage: "bubble.left.and.bubble.right.fill") }
                .tag(4)
        }
        .navigationTitle(league.name)
        .navigationBarTitleDisplayMode(.inline)
        .tint(Color.appRed)
    }
}