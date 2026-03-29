import SwiftUI

// MARK: - Driver Season Detail

struct DriverSeasonView: View {
    let driver: JolpicaDriver
    let constructorName: String

    @State private var results: [JolpicaResultRace] = []
    @State private var isLoading = true

    private let season = Calendar.current.component(.year, from: Date())

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            if isLoading {
                LoadingView()
            } else if results.isEmpty {
                VStack(spacing: 12) {
                    Text("🏎").font(.system(size: 48))
                    Text("No results yet this season").font(.subheadline).foregroundStyle(.appTextDim)
                }
            } else {
                ScrollView {
                    VStack(spacing: 0) {
                        // Header card
                        HStack(spacing: 12) {
                            Circle()
                                .fill(constructorColor(for: constructorName))
                                .frame(width: 52, height: 52)
                                .overlay(
                                    Text(driver.abbreviation)
                                        .font(.system(size: 14, weight: .black))
                                        .foregroundStyle(.white)
                                )
                            VStack(alignment: .leading, spacing: 3) {
                                Text(driver.fullName)
                                    .font(.title3).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                                Text(constructorName)
                                    .font(.subheadline).foregroundStyle(.appTextDim)
                            }
                            Spacer()
                            if let num = driver.permanentNumber {
                                Text("#\(num)")
                                    .font(.system(size: 28, weight: .black, design: .rounded))
                                    .foregroundStyle(constructorColor(for: constructorName).opacity(0.8))
                            }
                        }
                        .padding(16)
                        .background(Color.appCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16).padding(.top, 16).padding(.bottom, 8)

                        // Season stats
                        let finishedResults = results.compactMap { $0.results?.first }
                        let totalPoints = finishedResults.reduce(0.0) { $0 + (Double($1.points) ?? 0) }
                        let wins = finishedResults.filter { $0.position == "1" }.count
                        let podiums = finishedResults.filter { Int($0.position) ?? 99 <= 3 }.count

                        HStack(spacing: 0) {
                            statCell(value: String(format: "%.0f", totalPoints), label: "Points")
                            Divider().background(Color.appBorder)
                            statCell(value: "\(wins)", label: "Wins")
                            Divider().background(Color.appBorder)
                            statCell(value: "\(podiums)", label: "Podiums")
                            Divider().background(Color.appBorder)
                            statCell(value: "\(finishedResults.count)", label: "Races")
                        }
                        .frame(height: 60)
                        .background(Color.appCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16).padding(.bottom, 8)

                        // Round-by-round
                        VStack(spacing: 0) {
                            ForEach(Array(results.enumerated()), id: \.offset) { i, race in
                                if let result = race.results?.first {
                                    DriverRaceRoundRow(raceName: race.raceName, date: race.date, result: result)
                                    if i < results.count - 1 {
                                        Color.appBorder.frame(height: 0.5).padding(.leading, 16)
                                    }
                                }
                            }
                        }
                        .background(Color.appCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16).padding(.bottom, 32)
                    }
                }
            }
        }
        .navigationTitle(driver.familyName)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func statCell(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 20, weight: .bold, design: .rounded)).foregroundStyle(.appTextPrimary)
            Text(label).font(.caption2).foregroundStyle(.appTextDim)
        }
        .frame(maxWidth: .infinity)
    }

    private func load() async {
        let url = URL(string: "https://api.jolpi.ca/ergast/f1/\(season)/drivers/\(driver.driverId)/results.json")!
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let response = try? JSONDecoder().decode(JolpicaResultsResponse.self, from: data) else {
            isLoading = false; return
        }
        results = response.mrData.raceTable.races
        isLoading = false
    }
}

struct DriverRaceRoundRow: View {
    let raceName: String
    let date: String
    let result: JolpicaResult

    private var positionColor: Color {
        switch result.positionInt {
        case 1: return .appGold
        case 2: return Color(hex: "C0C0C0")
        case 3: return Color(hex: "CD7F32")
        default: return result.isFinished ? .appTextPrimary : .appError
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            // Position badge
            Text(result.isFinished ? "P\(result.position)" : result.positionText)
                .font(.system(size: 13, weight: .black, design: .rounded))
                .foregroundStyle(positionColor)
                .frame(width: 36, alignment: .center)
                .padding(.vertical, 4)
                .background(positionColor.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 6))

            VStack(alignment: .leading, spacing: 2) {
                Text(raceName.replacingOccurrences(of: " Grand Prix", with: " GP"))
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                    .lineLimit(1)
                Text(date).font(.caption2).foregroundStyle(.appTextDim)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text("\(result.points) pts")
                    .font(.system(size: 13, weight: .bold)).foregroundStyle(result.pointsDouble > 0 ? .appTextPrimary : .appTextFaint)
                if let delta = result.positionDelta, result.isFinished, delta != 0 {
                    HStack(spacing: 2) {
                        Image(systemName: delta > 0 ? "arrow.up" : "arrow.down")
                            .font(.system(size: 8, weight: .bold))
                        Text("\(abs(delta))").font(.system(size: 9, weight: .bold))
                    }
                    .foregroundStyle(delta > 0 ? Color.appSuccess : Color.appError)
                }
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
    }
}

// MARK: - Constructor Season Detail

struct ConstructorSeasonView: View {
    let constructor: JolpicaConstructor

    @State private var results: [JolpicaResultRace] = []
    @State private var isLoading = true

    private let season = Calendar.current.component(.year, from: Date())

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            if isLoading {
                LoadingView()
            } else if results.isEmpty {
                VStack(spacing: 12) {
                    Text("🏎").font(.system(size: 48))
                    Text("No results yet this season").font(.subheadline).foregroundStyle(.appTextDim)
                }
            } else {
                ScrollView {
                    VStack(spacing: 8) {
                        // Header
                        HStack(spacing: 12) {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(constructorColor(for: constructor.name))
                                .frame(width: 6, height: 52)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(constructor.name)
                                    .font(.title3).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                                Text(constructor.nationality ?? "")
                                    .font(.subheadline).foregroundStyle(.appTextDim)
                            }
                            Spacer()
                        }
                        .padding(16)
                        .background(Color.appCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16).padding(.top, 16)

                        // Season stats
                        let allResults = results.flatMap { $0.results ?? [] }
                        let totalPoints = allResults.reduce(0.0) { $0 + (Double($1.points) ?? 0) }
                        let wins = allResults.filter { $0.position == "1" }.count
                        let podiums = allResults.filter { Int($0.position) ?? 99 <= 3 }.count

                        HStack(spacing: 0) {
                            statCell(value: String(format: "%.0f", totalPoints), label: "Points")
                            Divider().background(Color.appBorder)
                            statCell(value: "\(wins)", label: "Wins")
                            Divider().background(Color.appBorder)
                            statCell(value: "\(podiums)", label: "Podiums")
                            Divider().background(Color.appBorder)
                            statCell(value: "\(results.count)", label: "Races")
                        }
                        .frame(height: 60)
                        .background(Color.appCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16)

                        // Round-by-round (both drivers per race)
                        VStack(spacing: 0) {
                            ForEach(Array(results.enumerated()), id: \.offset) { i, race in
                                ConstructorRaceRoundRow(race: race)
                                if i < results.count - 1 {
                                    Color.appBorder.frame(height: 0.5).padding(.leading, 16)
                                }
                            }
                        }
                        .background(Color.appCard)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal, 16).padding(.bottom, 32)
                    }
                }
            }
        }
        .navigationTitle(constructor.name)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func statCell(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 20, weight: .bold, design: .rounded)).foregroundStyle(.appTextPrimary)
            Text(label).font(.caption2).foregroundStyle(.appTextDim)
        }
        .frame(maxWidth: .infinity)
    }

    private func load() async {
        let url = URL(string: "https://api.jolpi.ca/ergast/f1/\(season)/constructors/\(constructor.constructorId)/results.json?limit=100")!
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let response = try? JSONDecoder().decode(JolpicaResultsResponse.self, from: data) else {
            isLoading = false; return
        }
        results = response.mrData.raceTable.races
        isLoading = false
    }
}

struct ConstructorRaceRoundRow: View {
    let race: JolpicaResultRace

    var body: some View {
        VStack(spacing: 0) {
            // Race name header
            Text(race.raceName.replacingOccurrences(of: " Grand Prix", with: " GP"))
                .font(.caption).fontWeight(.bold).foregroundStyle(.appTextDim)
                .textCase(.uppercase)
                .tracking(0.5)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 14).padding(.top, 10).padding(.bottom, 4)

            ForEach(race.results ?? [], id: \.id) { result in
                HStack(spacing: 12) {
                    Text(result.isFinished ? "P\(result.position)" : result.positionText)
                        .font(.system(size: 12, weight: .black, design: .rounded))
                        .foregroundStyle(positionColor(result.positionInt))
                        .frame(width: 32, alignment: .center)
                        .padding(.vertical, 3)
                        .background(positionColor(result.positionInt).opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 5))

                    Text(result.driver.fullName)
                        .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                        .lineLimit(1)

                    Spacer()

                    Text("\(result.points) pts")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(result.pointsDouble > 0 ? .appTextPrimary : .appTextFaint)
                }
                .padding(.horizontal, 14).padding(.vertical, 6)
            }

            Spacer(minLength: 8)
        }
    }

    private func positionColor(_ pos: Int?) -> Color {
        switch pos {
        case 1: return .appGold
        case 2: return Color(hex: "C0C0C0")
        case 3: return Color(hex: "CD7F32")
        default: return .appTextDim
        }
    }
}
