import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    @State private var unreadCount = 0
    @Environment(AuthService.self) private var authService

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                LeaguesListView()
            }
            .tabItem { Label("Leagues", systemImage: "flag.checkered") }
            .tag(0)

            NavigationStack {
                DiscoverLeaguesView()
            }
            .tabItem { Label("Discover", systemImage: "magnifyingglass") }
            .tag(1)

            NavigationStack {
                NotificationsView()
            }
            .tabItem { Label("Alerts", systemImage: "bell") }
            .badge(unreadCount > 0 ? unreadCount : 0)
            .tag(2)

            NavigationStack {
                ProfileView()
            }
            .tabItem { Label("Profile", systemImage: "person.circle") }
            .tag(3)
        }
        .tint(Color.appRed)
        .preferredColorScheme(.dark)
        .task { await loadUnreadCount() }
    }

    private func loadUnreadCount() async {
        guard let response = try? await APIClient.shared.request(
            "GET", path: "/api/notifications"
        ) as NotificationsResponse else { return }
        unreadCount = response.unreadCount
    }
}