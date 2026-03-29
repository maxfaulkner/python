import Foundation
import Observation

@Observable
final class ChatViewModel {
    var messages: [LeagueMessage] = []
    var inputText = ""
    var replyingTo: LeagueMessage?
    var isLoading = false
    var isSending = false
    var errorMessage: String?

    private var pollTask: Task<Void, Never>?
    private let leagueId: String

    init(leagueId: String) {
        self.leagueId = leagueId
    }

    func loadMessages(refresh: Bool = false) async {
        if !refresh { isLoading = true }
        do {
            let fetched: [LeagueMessage] = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/chat"
            )
            messages = fetched
        } catch {}
        if !refresh { isLoading = false }
    }

    func loadOlderMessages() async {
        guard let oldest = messages.first else { return }
        do {
            let fetched: [LeagueMessage] = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/chat",
                queryItems: [URLQueryItem(name: "before", value: oldest.id), URLQueryItem(name: "limit", value: "50")]
            )
            messages = fetched + messages
        } catch {}
    }

    func sendMessage() async {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        inputText = ""
        isSending = true
        do {
            let sent: LeagueMessage = try await APIClient.shared.request(
                "POST", path: "/api/leagues/\(leagueId)/chat",
                body: SendMessageRequest(content: text, replyToId: replyingTo?.id)
            )
            messages.append(sent)
            replyingTo = nil
        } catch let e as APIError { errorMessage = e.errorDescription; inputText = text }
        catch { inputText = text }
        isSending = false
    }

    func startPolling() {
        pollTask = Task {
            while !Task.isCancelled {
                do {
                    try await Task.sleep(for: .seconds(8))
                    await loadMessages(refresh: true)
                } catch { break }
            }
        }
    }

    func stopPolling() { pollTask?.cancel() }
}