import SwiftUI

// MARK: - Models

struct ActivityEvent: Decodable, Identifiable {
    let id: String
    let type: String         // team_submitted | results_imported | chat_message | member_joined
    let title: String
    let userId: String?
    let userName: String?
    let week: Int?
    let timestamp: String
}

struct ActivityResponse: Decodable {
    let events: [ActivityEvent]
}

// MARK: - ViewModel

@Observable
final class ActivityFeedViewModel {
    var events: [ActivityEvent] = []
    var isLoading = false
    var errorMessage: String?

    func load(leagueId: String) async {
        isLoading = true
        do {
            let response: ActivityResponse = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/activity"
            )
            events = response.events
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }
}

// MARK: - View

struct ActivityFeedView: View {
    let leagueId: String
    @State private var vm = ActivityFeedViewModel()

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Activity")
                .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                .padding(.horizontal, 16).padding(.top, 12).padding(.bottom, 8)

            if vm.isLoading && vm.events.isEmpty {
                HStack { Spacer(); ProgressView().padding(); Spacer() }
            } else if vm.events.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "clock.arrow.circlepath").foregroundStyle(.appTextFaint)
                    Text("No recent activity").font(.caption).foregroundStyle(.appTextFaint)
                }
                .padding(.horizontal, 16).padding(.bottom, 12)
            } else {
                ForEach(vm.events) { event in
                    EventRow(event: event)
                    if event.id != vm.events.last?.id {
                        Color.appBorder.frame(height: 0.5).padding(.leading, 48)
                    }
                }
            }
        }
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .task { await vm.load(leagueId: leagueId) }
    }
}

private struct EventRow: View {
    let event: ActivityEvent

    private var icon: (name: String, color: Color) {
        switch event.type {
        case "results_imported": return ("flag.checkered", .appRed)
        case "team_submitted":   return ("person.3.fill", .appGold)
        case "chat_message":     return ("bubble.left.fill", Color(hex: "60a5fa"))
        case "member_joined":    return ("person.badge.plus", .appSuccess)
        default:                 return ("circle.fill", .appTextDim)
        }
    }

    private var relativeTime: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        guard let date = formatter.date(from: event.timestamp) else { return "" }
        let diff = Date.now.timeIntervalSince(date)
        if diff < 60 { return "just now" }
        if diff < 3600 { return "\(Int(diff / 60))m ago" }
        if diff < 86400 { return "\(Int(diff / 3600))h ago" }
        return "\(Int(diff / 86400))d ago"
    }

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().fill(icon.color.opacity(0.15)).frame(width: 32, height: 32)
                Image(systemName: icon.name).font(.system(size: 13)).foregroundStyle(icon.color)
            }
            Text(event.title)
                .font(.caption).foregroundStyle(.appTextPrimary)
                .lineLimit(2)
            Spacer(minLength: 0)
            Text(relativeTime)
                .font(.caption2).foregroundStyle(.appTextFaint)
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
    }
}
