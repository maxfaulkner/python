import SwiftUI

struct ContentView: View {
    @Environment(AuthService.self) private var authService
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false

    var body: some View {
        if authService.isAuthenticated {
            MainTabView()
        } else if !hasSeenOnboarding {
            OnboardingView()
        } else {
            NavigationStack {
                LoginView()
            }
        }
    }
}