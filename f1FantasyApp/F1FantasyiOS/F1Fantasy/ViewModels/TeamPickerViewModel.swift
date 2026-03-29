import Foundation
import Observation

@Observable
final class TeamPickerViewModel {
    // Selection state
    var selectedDriverIds: [String] = []
    var selectedConstructorId: String?
    var captainId: String?
    var chipUsed: String?

    // Data
    var pricesResponse: PricesResponse?
    var existingTeam: WeeklyTeam?
    var isLoading = false
    var isSubmitting = false
    var errorMessage: String?
    var submitSuccess = false

    // UI filters
    var searchText = ""
    var filterConstructorId: String?

    // Computed
    var driverPrice: (String) -> Double {
        { [weak self] id in
            self?.pricesResponse?.drivers.first(where: { $0.driverId == id })?.price ?? 0
        }
    }

    var budgetUsed: Double {
        let driverCost = selectedDriverIds.compactMap { id in
            pricesResponse?.drivers.first(where: { $0.driverId == id })?.price
        }.reduce(0, +)
        let constructorCost = pricesResponse?.constructors
            .first(where: { $0.constructorId == selectedConstructorId })?.price ?? 0
        return driverCost + constructorCost
    }

    var totalBudget: Double { pricesResponse?.totalBudget ?? 100 }
    var budgetRemaining: Double { totalBudget - budgetUsed }
    var isOverBudget: Bool { budgetRemaining < 0 }
    var isTeamLocked: Bool { pricesResponse?.locked ?? existingTeam?.locked ?? false }
    var isTeamComplete: Bool { selectedDriverIds.count == 5 && selectedConstructorId != nil }
    var canSubmit: Bool { isTeamComplete && !isTeamLocked && !isOverBudget }

    var availableChips: [Chip] { pricesResponse?.chips?.filter { $0.isAvailable } ?? [] }

    var filteredDrivers: [DriverPriceEntry] {
        guard let prices = pricesResponse?.drivers else { return [] }
        return prices.filter { entry in
            let matchesSearch = searchText.isEmpty ||
                (entry.driver?.name.localizedCaseInsensitiveContains(searchText) ?? false)
            let matchesTeam = filterConstructorId == nil ||
                entry.driver?.constructorId == filterConstructorId
            return matchesSearch && matchesTeam
        }
    }

    func load(leagueId: String, week: Int) async {
        isLoading = true
        errorMessage = nil
        async let prices: PricesResponse = APIClient.shared.request(
            "GET", path: "/api/leagues/\(leagueId)/prices/\(week)"
        )
        async let team: WeeklyTeam? = {
            try? await APIClient.shared.request(
                "GET", path: "/api/leagues/\(leagueId)/team/\(week)"
            ) as WeeklyTeam
        }()
        do {
            pricesResponse = try await prices
            existingTeam = await team
            if let team = existingTeam {
                selectedDriverIds = team.drivers.map { $0.driverId }
                selectedConstructorId = team.constructors.first?.constructorId
                captainId = team.captainId
                chipUsed = team.chipUsed
            }
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    func toggleDriver(_ driverId: String) {
        if selectedDriverIds.contains(driverId) {
            selectedDriverIds.removeAll { $0 == driverId }
            if captainId == driverId { captainId = selectedDriverIds.first }
        } else if selectedDriverIds.count < 5 {
            selectedDriverIds.append(driverId)
            if selectedDriverIds.count == 1 { captainId = driverId }
        }
    }

    func submit(leagueId: String, week: Int) async {
        guard canSubmit else { return }
        isSubmitting = true
        errorMessage = nil
        do {
            let _: SubmitTeamResponse = try await APIClient.shared.request(
                "POST", path: "/api/leagues/\(leagueId)/team/\(week)",
                body: SubmitTeamRequest(
                    drivers: selectedDriverIds,
                    constructorId: selectedConstructorId!,
                    captainId: captainId,
                    chipUsed: chipUsed
                )
            )
            submitSuccess = true
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isSubmitting = false
    }
}