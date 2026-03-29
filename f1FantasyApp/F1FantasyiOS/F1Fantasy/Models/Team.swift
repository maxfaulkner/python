import Foundation

struct PricesResponse: Decodable {
    let week: Int
    let drivers: [DriverPriceEntry]
    let constructors: [ConstructorPriceEntry]
    let totalBudget: Double
    let locked: Bool
    let chips: [Chip]?
}

struct WeeklyTeam: Decodable, Identifiable {
    let id: String
    let userId: String
    let leagueId: String
    let week: Int
    let budgetUsed: Double
    let locked: Bool
    let captainId: String?
    let chipUsed: String?
    let drivers: [TeamDriverEntry]
    let constructors: [TeamConstructorEntry]
    var totalRoundPoints: Int?
}

struct TeamDriverEntry: Decodable, Identifiable {
    let id: String
    let driverId: String
    let pricePaidPerPoint: Double?
    var roundPoints: Int?
    let driver: Driver?
}

struct TeamConstructorEntry: Decodable, Identifiable {
    let id: String
    let constructorId: String
    let pricePaidPerPoint: Double?
    var roundPoints: Int?
    let constructor: Constructor?
}

struct Chip: Codable, Identifiable {
    let id: String
    let userId: String
    let leagueId: String
    let type: String    // "wildcard" | "triple_captain" | "no_negative" | "bench_boost"
    let usedWeek: Int?

    var isAvailable: Bool { usedWeek == nil }
}

struct SubmitTeamResponse: Decodable {
    let message: String
    let team: WeeklyTeam?
}