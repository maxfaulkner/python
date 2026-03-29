import Foundation
import Observation

@Observable
final class LeaguesViewModel {
    var leagues: [League] = []
    var isLoading = false
    var errorMessage: String?
    var joinCode = ""
    var isJoining = false
    var joinError: String?

    func load() async {
        isLoading = true
        errorMessage = nil
        do {
            let response: [League] = try await APIClient.shared.request("GET", path: "/api/leagues")
            leagues = response
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func joinByCode() async throws {
        isJoining = true
        joinError = nil
        defer { isJoining = false }
        let _: JoinLeagueResponse = try await APIClient.shared.request(
            "POST", path: "/api/leagues/join-code/\(joinCode.trimmingCharacters(in: .whitespaces))"
        )
        await load()
    }

    func createLeague(name: String, season: Int, startingRound: Int,
                      type: String, isPublic: Bool) async throws -> League {
        let body = CreateLeagueRequest(name: name, season: season, startingRound: startingRound,
                                       description: nil, leagueType: type, isPublic: isPublic, maxPlayers: nil)
        let response: CreateLeagueResponse = try await APIClient.shared.request(
            "POST", path: "/api/leagues", body: body
        )
        await load()
        return response.league
    }
}