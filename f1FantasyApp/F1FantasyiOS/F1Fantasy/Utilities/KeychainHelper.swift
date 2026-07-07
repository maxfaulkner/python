import Foundation
import Security

final class KeychainHelper {
    static let shared = KeychainHelper()
    private let service = Bundle.main.bundleIdentifier ?? "com.maxfaulkner.f1fantasy"

    private init() {}

    func save(_ data: Data, forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func load(forKey key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)
        return result as? Data
    }

    func delete(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }

    func saveToken(_ token: String) {
        save(Data(token.utf8), forKey: "jwt_token")
    }

    func loadToken() -> String? {
        guard let data = load(forKey: "jwt_token") else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func deleteToken() {
        delete(forKey: "jwt_token")
    }
}