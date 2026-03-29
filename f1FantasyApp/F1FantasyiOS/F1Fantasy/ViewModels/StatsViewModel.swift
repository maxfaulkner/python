import Foundation
import Observation

@Observable
final class StatsViewModel {
    var stats: StatsResponse?
    var driverForm: [DriverPriceEntry] = []
    var constructorForm: [ConstructorPriceEntry] = []
    var isLoading = false
    var errorMessage: String?
    var activeTab: StatsTab = .performance

    enum StatsTab { case performance, prices }

    func load(leagueId: String, week: Int) async {
        isLoading = true
        async let statsResult: StatsResponse = APIClient.shared.request(
            "GET", path: "/api/leagues/\(leagueId)/stats"
        )
        async let formResult: PricesResponse = APIClient.shared.request(
            "GET", path: "/api/leagues/\(leagueId)/prices/\(week)"
        )
        do {
            stats = try await statsResult
            let form = try await formResult
            driverForm = form.drivers
            constructorForm = form.constructors
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }
}