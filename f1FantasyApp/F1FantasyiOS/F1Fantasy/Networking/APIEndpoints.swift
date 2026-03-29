import Foundation

// MARK: - Request Bodies

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let email: String
    let name: String
    let password: String
}

struct CreateLeagueRequest: Encodable {
    let name: String
    let season: Int
    let startingRound: Int
    let description: String?
    let leagueType: String
    let isPublic: Bool
    let maxPlayers: Int?
}

struct SubmitTeamRequest: Encodable {
    let drivers: [String]
    let constructorId: String
    let captainId: String?
    let chipUsed: String?
}

struct SendMessageRequest: Encodable {
    let content: String
    let replyToId: String?
}

struct UpdateProfileRequest: Encodable {
    let name: String?
    let bio: String?
    let avatarColor: String?
}

struct AddReactionRequest: Encodable {
    let emoji: String
}