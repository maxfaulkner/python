import Foundation
import Observation

@Observable
final class AuthService {
    var currentUser: User?

    var isAuthenticated: Bool {
        currentUser != nil && KeychainHelper.shared.loadToken() != nil
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
}