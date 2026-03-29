import SwiftUI

// MARK: - Ergast/Jolpica Models

private struct ErgastScheduleResponse: Decodable {
    let mrData: MRData
    enum CodingKeys: String, CodingKey { case mrData = "MRData" }
}
private struct MRData: Decodable {
    let raceTable: RaceTable
    enum CodingKeys: String, CodingKey { case raceTable = "RaceTable" }
}
private struct RaceTable: Decodable {
    let races: [F1Race]
    enum CodingKeys: String, CodingKey { case races = "Races" }
}
private struct F1Race: Decodable, Identifiable {
    let season: String
    let round: String
    let raceName: String
    let circuit: F1Circuit
    let date: String
    let time: String?
    let firstPractice: F1Session?
    let secondPractice: F1Session?
    let thirdPractice: F1Session?
    let qualifying: F1Session?
    let sprint: F1Session?
    let sprintQualifying: F1Session?
    var id: String { "\(season)-\(round)" }
    enum CodingKeys: String, CodingKey {
        case season, round, raceName, circuit = "Circuit", date, time
        case firstPractice = "FirstPractice"
        case secondPractice = "SecondPractice"
        case thirdPractice = "ThirdPractice"
        case qualifying = "Qualifying"
        case sprint = "Sprint"
        case sprintQualifying = "SprintQualifying"
    }
}
private struct F1Circuit: Decodable {
    let circuitName: String
    let location: F1Location
    enum CodingKeys: String, CodingKey { case circuitName, location = "Location" }
}
private struct F1Location: Decodable {
    let locality: String
    let country: String
}
private struct F1Session: Decodable {
    let date: String
    let time: String?
}

// MARK: - View

struct CalendarView: View {
    @State private var races: [F1Race] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let season = Calendar.current.component(.year, from: Date())

    private let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f
    }()

    private var nextRaceRound: String? {
        races.first(where: { dateFormatter.date(from: $0.date).map { $0 >= .now } ?? false })?.round
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            Group {
                if isLoading && races.isEmpty { LoadingView() }
                else if let err = errorMessage { ErrorView(message: err) { Task { await load() } } }
                else {
                    List(races) { race in
                        NavigationLink(destination: detailView(for: race)) {
                            RaceRow(race: race, isNext: race.round == nextRaceRound)
                        }
                        .listRowBackground(Color.appCard)
                        .listRowSeparatorTint(Color.appBorder)
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .navigationTitle("\(season) Calendar")
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        do {
            let url = URL(string: "https://api.jolpi.ca/ergast/f1/\(season).json")!
            let (data, _) = try await URLSession.shared.data(from: url)
            let response = try JSONDecoder().decode(ErgastScheduleResponse.self, from: data)
            races = response.mrData.raceTable.races
        } catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    private func detailView(for race: F1Race) -> RaceWeekendDetailView {
        var sessions: [RaceWeekendSession] = []
        let isSprint = race.sprint != nil || race.sprintQualifying != nil

        if let fp1 = race.firstPractice {
            sessions.append(.init(name: "Practice 1", date: fp1.date, time: fp1.time, isFeature: false))
        }
        if isSprint {
            if let sq = race.sprintQualifying {
                sessions.append(.init(name: "Sprint Qualifying", date: sq.date, time: sq.time, isFeature: false))
            }
            if let s = race.sprint {
                sessions.append(.init(name: "Sprint", date: s.date, time: s.time, isFeature: true))
            }
        } else {
            if let fp2 = race.secondPractice {
                sessions.append(.init(name: "Practice 2", date: fp2.date, time: fp2.time, isFeature: false))
            }
        }
        if let q = race.qualifying {
            sessions.append(.init(name: "Qualifying", date: q.date, time: q.time, isFeature: false))
        }
        if !isSprint, let fp3 = race.thirdPractice {
            sessions.append(.init(name: "Practice 3", date: fp3.date, time: fp3.time, isFeature: false))
        }
        sessions.append(.init(name: "Race", date: race.date, time: race.time, isFeature: true))

        return RaceWeekendDetailView(
            raceName: race.raceName,
            circuitName: race.circuit.circuitName,
            locality: race.circuit.location.locality,
            country: race.circuit.location.country,
            sessions: sessions.sorted { $0.date < $1.date }
        )
    }
}

private struct RaceRow: View {
    let race: F1Race
    let isNext: Bool

    var body: some View {
        HStack(spacing: 12) {
            VStack(spacing: 4) {
                Text("R\(race.round)")
                    .font(.caption2).fontWeight(.bold)
                    .foregroundStyle(isNext ? .black : .appTextDim)
                    .frame(width: 32, height: 32)
                    .background(isNext ? Color.appRed : Color.appCardRaised)
                    .clipShape(Circle())
                if race.sprint != nil {
                    Text("S").font(.system(size: 8)).fontWeight(.bold)
                        .foregroundStyle(.appGold)
                        .frame(width: 16, height: 16)
                        .background(Color.appGold.opacity(0.2))
                        .clipShape(Circle())
                }
            }

            VStack(alignment: .leading, spacing: 2) {
                if isNext {
                    Text("NEXT RACE")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.appRed)
                        .padding(.horizontal, 5).padding(.vertical, 1)
                        .background(Color.appRed.opacity(0.15))
                        .clipShape(Capsule())
                }
                Text(race.raceName)
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundStyle(isNext ? .appTextPrimary : .appTextPrimary)
                Text("\(race.circuit.location.locality), \(race.circuit.location.country)")
                    .font(.caption2).foregroundStyle(.appTextDim)
            }
            Spacer()
            Text(race.date)
                .font(.caption2).foregroundStyle(.appTextDim)
        }
        .padding(.vertical, 4)
    }
}