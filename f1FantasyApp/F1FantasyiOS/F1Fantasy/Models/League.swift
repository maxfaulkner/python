import Foundation

struct League: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let season: Int
    let startingRound: Int
    let leagueType: String
    let isPublic: Bool
    let inviteCode: String?
    let maxPlayers: Int
    let budget: Double
    let transfersPerRound: Int
    let adminEmail: String?
    let allowWildcard: Bool?
    let allowTripleCap: Bool?

    // Enriched fields from GET /api/leagues (user-specific)
    var memberCount: Int?
    var myRole: String?
    var myTeamName: String?
    var myTotalPoints: Int?
    var myTotalWins: Int?
    var myRank: Int?
    var currentWeek: Int?

    // scoringConfig is Json? on the server — skip it to avoid decode failures
    enum CodingKeys: String, CodingKey {
        case id, name, description, season, startingRound, leagueType, isPublic
        case inviteCode, maxPlayers, budget, transfersPerRound
        case adminEmail, allowWildcard, allowTripleCap
        case memberCount, myRole, myTeamName, myTotalPoints, myTotalWins, myRank, currentWeek
    }
}

struct LeaguesResponse: Decodable {
    let leagues: [League]
}

struct LeagueResponse: Decodable {
    let league: League
}

struct CreateLeagueResponse: Decodable {
    let message: String
    let league: League
}

struct JoinLeagueResponse: Decodable {
    let message: String
    let leagueId: String
    let leagueName: String
}
