import Foundation

struct RaceResultsResponse: Decodable {
    let week: Int
    let drivers: [DriverResult]
    let constructors: [ConstructorResult]
}

struct DriverResult: Decodable, Identifiable {
    let position: Int
    let gridPosition: Int?
    let points: Int
    let isSprint: Bool
    let driver: Driver

    var id: String { driver.id }

    var positionDelta: Int? {
        guard let grid = gridPosition else { return nil }
        return grid - position // positive = gained places
    }
}

struct ConstructorResult: Decodable, Identifiable {
    let points: Int
    let constructor: Constructor

    var id: String { constructor.id }
}
