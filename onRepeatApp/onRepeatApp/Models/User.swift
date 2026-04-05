import Foundation
import SwiftData

@Model
class User {
    var id: UUID
    var username: String
    var displayName: String
    var passwordHash: String
    var createdAt: Date

    init(username: String, displayName: String, passwordHash: String) {
        self.id = UUID()
        self.username = username.lowercased().trimmingCharacters(in: .whitespaces)
        self.displayName = displayName.trimmingCharacters(in: .whitespaces)
        self.passwordHash = passwordHash
        self.createdAt = Date()
    }
}
