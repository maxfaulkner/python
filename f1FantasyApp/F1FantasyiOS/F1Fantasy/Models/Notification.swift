import Foundation

struct AppNotification: Decodable, Identifiable {
    let id: String
    let type: String    // "rank_change" | "result_imported" | "message" | "achievement" | "deadline"
    let title: String
    let body: String
    let read: Bool
    let createdAt: Date
    let data: NotificationData?
}

struct NotificationData: Decodable {
    let leagueId: String?
    let week: Int?
    let userId: String?
}

struct NotificationsResponse: Decodable {
    let notifications: [AppNotification]
    let unreadCount: Int
}