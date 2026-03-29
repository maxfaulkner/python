import Foundation
import Observation

@Observable
final class LeaderboardViewModel {
    var seasonStandings: [LeaderboardEntry] = []
    var weeklyStandings: [WeeklyLeaderboardEntry] = []
    var latestRound: Int?
    var selectedWeek: Int?
    var viewMode: ViewMode = .season
    var isLoading = false
    var errorMessage: String?

    enum ViewMode { case season, weekly }

    var podium: [LeaderboardEntry] { Array(seasonStandings.prefix(3)) }

    func load(leagueId: String) async {
        isLoading = true
        errorMessage = nil
        do {
            let response: LeaderboardResponse = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/leaderboard"
            )
            seasonStandings = response.standings
            latestRound = response.latestRound
            if selectedWeek == nil { selectedWeek = response.latestRound }
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    func loadWeekly(leagueId: String, week: Int) async {
        do {
            let response: WeeklyLeaderboardResponse = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/leaderboard/weekly/\(week)"
            )
            weeklyStandings = response.standings
        } catch {}
    }
}