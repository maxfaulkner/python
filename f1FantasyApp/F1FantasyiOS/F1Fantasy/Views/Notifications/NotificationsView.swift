import SwiftUI

struct NotificationsView: View {
    @State private var notifications: [AppNotification] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            Group {
                if isLoading && notifications.isEmpty { LoadingView() }
                else if let err = errorMessage { ErrorView(message: err) { Task { await load() } } }
                else if notifications.isEmpty {
                    VStack(spacing: 12) {
                        Text("🔔").font(.system(size: 48))
                        Text("No notifications").font(.subheadline).foregroundStyle(.appTextDim)
                    }.frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(notifications) { notification in
                        NotificationRow(notification: notification)
                            .listRowBackground(notification.read ? Color.appCard : Color.appRed.opacity(0.08))
                            .listRowSeparatorTint(Color.appBorder)
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .navigationTitle("Notifications")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        isLoading = true
        do {
            let response: NotificationsResponse = try await APIClient.shared.request(
                "GET", path: "/api/notifications"
            )
            notifications = response.notifications
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }
}

struct NotificationRow: View {
    let notification: AppNotification

    private var icon: String {
        switch notification.type {
        case "result_imported": return "flag.checkered"
        case "rank_change":     return "list.number"
        case "message":         return "bubble.left"
        case "achievement":     return "trophy"
        case "deadline":        return "clock"
        default:                return "bell"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .frame(width: 36, height: 36)
                .background(Color.appCardRaised)
                .clipShape(Circle())
                .foregroundStyle(.appRed)
            VStack(alignment: .leading, spacing: 2) {
                Text(notification.title)
                    .font(.subheadline).fontWeight(notification.read ? .regular : .semibold)
                    .foregroundStyle(.appTextPrimary)
                Text(notification.body)
                    .font(.caption).foregroundStyle(.appTextDim).lineLimit(2)
                Text(notification.createdAt.relativeString)
                    .font(.caption2).foregroundStyle(.appTextFaint)
            }
            if !notification.read {
                Circle().fill(Color.appRed).frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 4)
    }
}