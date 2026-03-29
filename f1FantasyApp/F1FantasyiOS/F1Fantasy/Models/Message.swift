import Foundation

struct LeagueMessage: Decodable, Identifiable {
    let id: String
    let leagueId: String
    let userId: String
    let content: String
    let type: String
    let pinned: Bool
    let replyToId: String?
    let createdAt: Date
    let user: MessageUser?
    let reactions: [MessageReaction]
    let replyTo: ReplyPreview?
}

struct MessageUser: Decodable {
    let id: String
    let name: String
    let avatarColor: String?
}

struct MessageReaction: Decodable, Identifiable {
    let id: String
    let emoji: String
    let userId: String?
    let user: MessageUser?
}

struct ReplyPreview: Decodable {
    let id: String
    let content: String
    let user: MessageUser?
}

struct MessagesResponse: Decodable {
    let messages: [LeagueMessage]
}