import Foundation

struct Driver: Codable, Identifiable {
    let id: String
    let name: String
    let abbr: String?
    let number: Int?
    let nationality: String?
    let constructorId: String
    let isRookie: Bool
    let skillTier: Double?
    let constructor: Constructor?
}

struct Constructor: Codable, Identifiable {
    let id: String
    let name: String
    let nationality: String?
}

struct DriverPriceEntry: Codable, Identifiable {
    let id: String
    let driverId: String
    let week: Int
    let price: Double
    let driver: Driver?
    // Form data (from driver-form endpoint)
    var priceHistory: [Double]?
    var recentResults: [Int]?
    var selectionRate: Double?
}

struct ConstructorPriceEntry: Codable, Identifiable {
    let id: String
    let constructorId: String
    let week: Int
    let price: Double
    let constructor: Constructor?
    var priceHistory: [Double]?
}