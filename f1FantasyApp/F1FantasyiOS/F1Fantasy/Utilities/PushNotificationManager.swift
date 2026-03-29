import UIKit
import UserNotifications

/// Handles APNs registration and delivers the device token to the backend.
final class PushNotificationManager: NSObject {
    static let shared = PushNotificationManager()

    private override init() { super.init() }

    // MARK: - Permission + Registration

    func requestPermissionAndRegister() {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge]
        ) { granted, error in
            guard granted else {
                if let error { print("[Push] Permission denied:", error.localizedDescription) }
                return
            }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    // MARK: - Token Upload

    /// Call this from your AppDelegate or SwiftUI lifecycle when the device token arrives.
    func didRegister(deviceToken: Data) {
        let tokenString = deviceToken.map { String(format: "%02x", $0) }.joined()
        UserDefaults.standard.set(tokenString, forKey: "apns_device_token")
        Task { await uploadToken(tokenString) }
    }

    func didFailToRegister(error: Error) {
        print("[Push] Failed to register for remote notifications:", error.localizedDescription)
    }

    private func uploadToken(_ token: String) async {
        do {
            struct Body: Encodable { let pushToken: String }
            let _: EmptyResponse = try await APIClient.shared.request(
                "PUT", path: "/api/profile/push-token",
                body: Body(pushToken: token)
            )
        } catch {
            print("[Push] Token upload failed:", error.localizedDescription)
        }
    }

    /// Call when user logs out so the backend stops sending notifications to this device.
    func clearToken() async {
        do {
            struct Body: Encodable { let pushToken: String? }
            let _: EmptyResponse = try await APIClient.shared.request(
                "PUT", path: "/api/profile/push-token",
                body: Body(pushToken: nil)
            )
        } catch { /* best effort */ }
        UserDefaults.standard.removeObject(forKey: "apns_device_token")
    }
}

private struct EmptyResponse: Decodable {}
