import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    var bio: String?
    var avatarColor: String?

    var resolvedAvatarColor: String { avatarColor ?? "e10600" }
}

struct LoginResponse: Decodable {
    let message: String
    let token: String
    let user: User
}

struct RegisterResponse: Decodable {
    let message: String
    let user: User
}