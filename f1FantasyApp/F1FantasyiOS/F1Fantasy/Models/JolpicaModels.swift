import Foundation

// MARK: - Schedule

struct JolpicaScheduleResponse: Decodable {
    let mrData: JolpicaMRData<JolpicaRaceTable>
    enum CodingKeys: String, CodingKey { case mrData = "MRData" }
}

struct JolpicaMRData<T: Decodable>: Decodable {
    let total: String
    let raceTable: T?
    let standingsTable: JolpicaStandingsTable?
    enum CodingKeys: String, CodingKey {
        case total
        case raceTable = "RaceTable"
        case standingsTable = "StandingsTable"
    }
}

struct JolpicaRaceTable: Decodable {
    let races: [JolpicaRace]
    enum CodingKeys: String, CodingKey { case races = "Races" }
}

struct JolpicaRace: Decodable, Identifiable {
    let season: String
    let round: String
    let raceName: String
    let date: String
    let time: String?
    let circuit: JolpicaCircuit
    let sprint: JolpicaSession?

    var id: String { "\(season)-\(round)" }
    var roundInt: Int { Int(round) ?? 0 }
    var hasSprint: Bool { sprint != nil }

    enum CodingKeys: String, CodingKey {
        case season, round, raceName, date, time
        case circuit = "Circuit"
        case sprint = "Sprint"
    }
}

struct JolpicaCircuit: Decodable {
    let circuitName: String
    let location: JolpicaLocation
    enum CodingKeys: String, CodingKey { case circuitName, location = "Location" }
}

struct JolpicaLocation: Decodable {
    let locality: String
    let country: String
}

struct JolpicaSession: Decodable {
    let date: String
}

// MARK: - Race / Sprint results

struct JolpicaResultsResponse: Decodable {
    let mrData: JolpicaResultsMRData
    enum CodingKeys: String, CodingKey { case mrData = "MRData" }
}

struct JolpicaResultsMRData: Decodable {
    let raceTable: JolpicaResultsRaceTable
    enum CodingKeys: String, CodingKey { case raceTable = "RaceTable" }
}

struct JolpicaResultsRaceTable: Decodable {
    let races: [JolpicaResultRace]
    enum CodingKeys: String, CodingKey { case races = "Races" }
}

struct JolpicaResultRace: Decodable {
    let raceName: String
    let date: String
    let results: [JolpicaResult]?
    let sprintResults: [JolpicaResult]?
    enum CodingKeys: String, CodingKey {
        case raceName, date
        case results = "Results"
        case sprintResults = "SprintResults"
    }
}

struct JolpicaResult: Decodable, Identifiable {
    let position: String
    let positionText: String
    let points: String
    let grid: String
    let laps: String
    let status: String
    let driver: JolpicaDriver
    let constructor: JolpicaConstructor
    let time: JolpicaLapTime?
    let fastestLap: JolpicaFastestLap?

    var id: String { driver.driverId }
    var positionInt: Int? { Int(position) }
    var pointsDouble: Double { Double(points) ?? 0 }
    var gridInt: Int? { Int(grid) }
    var positionDelta: Int? {
        guard let p = positionInt, let g = gridInt, g > 0 else { return nil }
        return g - p
    }
    var isFinished: Bool { positionText != "R" && positionText != "D" && positionText != "E" && positionText != "W" && positionText != "F" && positionText != "N" }

    enum CodingKeys: String, CodingKey {
        case position, positionText, points, grid, laps, status
        case driver = "Driver"
        case constructor = "Constructor"
        case time = "Time"
        case fastestLap = "FastestLap"
    }
}

struct JolpicaDriver: Decodable {
    let driverId: String
    let givenName: String
    let familyName: String
    let nationality: String?
    let permanentNumber: String?
    var fullName: String { "\(givenName) \(familyName)" }
    var abbreviation: String { String(familyName.prefix(3)).uppercased() }
}

struct JolpicaConstructor: Decodable {
    let constructorId: String
    let name: String
    let nationality: String?
}

struct JolpicaLapTime: Decodable {
    let time: String
}

struct JolpicaFastestLap: Decodable {
    let rank: String
    let lap: String
    let time: JolpicaLapTime?
}

// MARK: - Qualifying

struct JolpicaQualifyingResponse: Decodable {
    let mrData: JolpicaQualifyingMRData
    enum CodingKeys: String, CodingKey { case mrData = "MRData" }
}

struct JolpicaQualifyingMRData: Decodable {
    let raceTable: JolpicaQualifyingRaceTable
    enum CodingKeys: String, CodingKey { case raceTable = "RaceTable" }
}

struct JolpicaQualifyingRaceTable: Decodable {
    let races: [JolpicaQualifyingRace]
    enum CodingKeys: String, CodingKey { case races = "Races" }
}

struct JolpicaQualifyingRace: Decodable {
    let qualifyingResults: [JolpicaQualifyingResult]
    enum CodingKeys: String, CodingKey { case qualifyingResults = "QualifyingResults" }
}

struct JolpicaQualifyingResult: Decodable, Identifiable {
    let position: String
    let driver: JolpicaDriver
    let constructor: JolpicaConstructor
    let q1: String?
    let q2: String?
    let q3: String?

    var id: String { driver.driverId }
    var positionInt: Int { Int(position) ?? 0 }

    enum CodingKeys: String, CodingKey {
        case position
        case driver = "Driver"
        case constructor = "Constructor"
        case q1 = "Q1", q2 = "Q2", q3 = "Q3"
    }
}

// MARK: - Championship Standings

struct JolpicaStandingsResponse: Decodable {
    let mrData: JolpicaStandingsMRData
    enum CodingKeys: String, CodingKey { case mrData = "MRData" }
}

struct JolpicaStandingsMRData: Decodable {
    let standingsTable: JolpicaStandingsTable
    enum CodingKeys: String, CodingKey { case standingsTable = "StandingsTable" }
}

struct JolpicaStandingsTable: Decodable {
    let standingsLists: [JolpicaStandingsList]
    enum CodingKeys: String, CodingKey { case standingsLists = "StandingsLists" }
}

struct JolpicaStandingsList: Decodable {
    let driverStandings: [JolpicaDriverStanding]?
    let constructorStandings: [JolpicaConstructorStanding]?
    enum CodingKeys: String, CodingKey {
        case driverStandings = "DriverStandings"
        case constructorStandings = "ConstructorStandings"
    }
}

struct JolpicaDriverStanding: Decodable, Identifiable {
    let position: String
    let points: String
    let wins: String
    let driver: JolpicaDriver
    let constructors: [JolpicaConstructor]

    var id: String { driver.driverId }
    var positionInt: Int { Int(position) ?? 0 }
    var pointsDouble: Double { Double(points) ?? 0 }
    var winsInt: Int { Int(wins) ?? 0 }
    var constructor: JolpicaConstructor? { constructors.first }

    enum CodingKeys: String, CodingKey {
        case position, points, wins
        case driver = "Driver"
        case constructors = "Constructors"
    }
}

struct JolpicaConstructorStanding: Decodable, Identifiable {
    let position: String
    let points: String
    let wins: String
    let constructor: JolpicaConstructor

    var id: String { constructor.constructorId }
    var positionInt: Int { Int(position) ?? 0 }
    var pointsDouble: Double { Double(points) ?? 0 }

    enum CodingKeys: String, CodingKey {
        case position, points, wins
        case constructor = "Constructor"
    }
}
