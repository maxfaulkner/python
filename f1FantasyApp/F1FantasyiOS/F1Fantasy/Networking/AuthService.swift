import Foundation
import Observation
import LocalAuthentication

@Observable
final class AuthService {
    var currentUser: User?

    var isAuthenticated: Bool {
        currentUser != nil && KeychainHelper.shared.loadToken() != nil
    }

    /// Whether the user has opted in to biometric unlock for this app.
    var biometricEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "biometric_enabled") }
        set { UserDefaults.standard.set(newValue, forKey: "biometric_enabled") }
    }

    /// The display name for the available biometry type (Face ID / Touch ID / none).
    var biometryTypeName: String {
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err) else { return "" }
        switch ctx.biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        default: return ""
        }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: "cached_user"),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            currentUser = user
        }
    }

    func login(email: String, password: String) async throws {
        let response: LoginResponse = try await APIClient.shared.request(
            "POST", path: "/auth/login",
            body: LoginRequest(email: email, password: password)
        )
        KeychainHelper.shared.saveToken(response.token)
        currentUser = response.user
        UserDefaults.standard.set(try? JSONEncoder().encode(response.user), forKey: "cached_user")
        NotificationCenter.default.post(name: .userDidLogin, object: nil)
    }

    func register(email: String, name: String, password: String) async throws {
        let _: RegisterResponse = try await APIClient.shared.request(
            "POST", path: "/auth/register",
            body: RegisterRequest(email: email, name: name, password: password)
        )
        // Server doesn't return a token on register — auto-login
        try await login(email: email, password: password)
    }

    func logout() {
        KeychainHelper.shared.deleteToken()
        currentUser = nil
        UserDefaults.standard.removeObject(forKey: "cached_user")
    }

    /// Authenticate with biometrics. Returns true on success; throws on failure.
    @discardableResult
    func authenticateWithBiometrics(reason: String = "Unlock F1 Fantasy") async throws -> Bool {
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err) else {
            throw err ?? LAError(.biometryNotAvailable)
        }
        return try await ctx.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
    }

    /// If the user has a cached token + biometrics enabled, authenticate and restore session.
    func tryBiometricUnlock() async throws {
        guard biometricEnabled,
              KeychainHelper.shared.loadToken() != nil,
              let data = UserDefaults.standard.data(forKey: "cached_user"),
              let user = try? JSONDecoder().decode(User.self, from: data)
        else { return }
        try await authenticateWithBiometrics()
        currentUser = user
        NotificationCenter.default.post(name: .userDidLogin, object: nil)
    }
}