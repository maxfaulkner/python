import Foundation
import Observation
import CryptoKit

// MARK: - Auth Store

/// Shared observable state for the current logged-in user.
/// Injected into the environment at the app root.
@Observable
final class AuthStore {

    // MARK: - State

    var currentUserID: UUID? = nil
    var currentDisplayName: String = ""

    var isLoggedIn: Bool { currentUserID != nil }

    // MARK: - UserDefaults Keys

    private let userIDKey = "currentUserID"
    private let displayNameKey = "currentDisplayName"

    // MARK: - Init

    init() {
        if let str = UserDefaults.standard.string(forKey: userIDKey),
           let uuid = UUID(uuidString: str) {
            currentUserID = uuid
            currentDisplayName = UserDefaults.standard.string(forKey: displayNameKey) ?? ""
        }
    }

    // MARK: - API

    func login(user: User) {
        currentUserID = user.id
        currentDisplayName = user.displayName
        save()
    }

    func logout() {
        currentUserID = nil
        currentDisplayName = ""
        save()
    }

    // MARK: - Password Hashing

    static func hashPassword(_ password: String) -> String {
        let data = Data(password.utf8)
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Persistence

    private func save() {
        if let id = currentUserID {
            UserDefaults.standard.set(id.uuidString, forKey: userIDKey)
            UserDefaults.standard.set(currentDisplayName, forKey: displayNameKey)
        } else {
            UserDefaults.standard.removeObject(forKey: userIDKey)
            UserDefaults.standard.removeObject(forKey: displayNameKey)
        }
    }
}
