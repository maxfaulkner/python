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
            if refresh {
                // Merge: only append messages not already in the list
                let existingIds = Set(messages.map { $0.id })
                let newMessages = fetched.filter { !existingIds.contains($0.id) }
                if !newMessages.isEmpty { messages.append(contentsOf: newMessages) }
            } else {
                messages = fetched
            }
        } catch let e as APIError {
            if !refresh { errorMessage = e.errorDescription }
        } catch {
            if !refresh { errorMessage = error.localizedDescription }
        }
        if !refresh { isLoading = false }
    }

    func loadOlderMessages() async {
        guard let oldest = messages.first else { return }
        do {
            let fetched: [LeagueMessage] = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/chat",
                queryItems: [URLQueryItem(name: "before", value: oldest.id), URLQueryItem(name: "limit", value: "50")]
            )
            let existingIds = Set(messages.map { $0.id })
            let newOlder = fetched.filter { !existingIds.contains($0.id) }
            messages = newOlder + messages
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
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
        // Cancel any existing poll loop before starting a new one
        pollTask?.cancel()
        pollTask = Task {
            while !Task.isCancelled {
                do {
                    try await Task.sleep(for: .seconds(8))
                    if !Task.isCancelled { await loadMessages(refresh: true) }
                } catch { break }
            }
        }
    }

    func stopPolling() {
        pollTask?.cancel()
        pollTask = nil
    }
}