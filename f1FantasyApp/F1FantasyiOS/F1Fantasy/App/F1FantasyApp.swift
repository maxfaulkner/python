import SwiftUI
import UIKit

@main
struct F1FantasyApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @State private var authService = AuthService()
    @AppStorage("colorSchemePreference") private var colorSchemePreference = "dark"

    private var preferredColorScheme: ColorScheme? {
        switch colorSchemePreference {
        case "light": return .light
        case "dark": return .dark
        default: return nil   // "system"
        }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authService)
                .preferredColorScheme(preferredColorScheme)
                .onReceive(NotificationCenter.default.publisher(for: .userDidLogin)) { _ in
                    PushNotificationManager.shared.requestPermissionAndRegister()
                }
        }
    }
}

// MARK: - App Delegate (APNs callbacks)

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        PushNotificationManager.shared.didRegister(deviceToken: deviceToken)
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        PushNotificationManager.shared.didFailToRegister(error: error)
    }
}

extension Notification.Name {
    static let userDidLogin = Notification.Name("userDidLogin")
}
