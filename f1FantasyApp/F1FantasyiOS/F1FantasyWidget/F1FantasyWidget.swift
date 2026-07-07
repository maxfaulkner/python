import WidgetKit
import SwiftUI

// MARK: - Data model shared with the app via App Group
// Add App Group "group.com.maxfaulkner.f1fantasy" to both targets in Xcode.

struct WidgetLeagueEntry: TimelineEntry {
    let date: Date
    let leagueName: String
    let myRank: Int?
    let totalPoints: Int
    let nextRaceName: String?
    let nextRaceDate: String?
}

// MARK: - Provider

struct F1WidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> WidgetLeagueEntry {
        WidgetLeagueEntry(
            date: Date(),
            leagueName: "My League",
            myRank: 3,
            totalPoints: 247,
            nextRaceName: "Bahrain GP",
            nextRaceDate: "29 Mar"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetLeagueEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetLeagueEntry>) -> Void) {
        let entry = loadEntry()
        // Refresh every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> WidgetLeagueEntry {
        let defaults = UserDefaults(suiteName: "group.com.maxfaulkner.f1fantasy")
        return WidgetLeagueEntry(
            date: Date(),
            leagueName: defaults?.string(forKey: "widget_league_name") ?? "F1 Fantasy",
            myRank: defaults?.object(forKey: "widget_my_rank") as? Int,
            totalPoints: defaults?.integer(forKey: "widget_total_points") ?? 0,
            nextRaceName: defaults?.string(forKey: "widget_next_race_name"),
            nextRaceDate: defaults?.string(forKey: "widget_next_race_date")
        )
    }
}

// MARK: - Widget Views

struct F1WidgetEntryView: View {
    var entry: WidgetLeagueEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:  smallView
        case .systemMedium: mediumView
        default:            smallView
        }
    }

    private var smallView: some View {
        ZStack {
            Color(red: 0.035, green: 0.035, blue: 0.043)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(red: 0.882, green: 0.024, blue: 0))
                        .frame(width: 3, height: 14)
                    Text("F1 Fantasy")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color(red: 0.882, green: 0.024, blue: 0))
                }
                Text(entry.leagueName)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Spacer()
                if let rank = entry.myRank {
                    HStack(alignment: .lastTextBaseline, spacing: 2) {
                        Text("P\(rank)")
                            .font(.system(size: 28, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    }
                }
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    Text("\(entry.totalPoints)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(Color(red: 0.980, green: 0.620, blue: 0.043))
                    Text("pts")
                        .font(.system(size: 10))
                        .foregroundStyle(Color(red: 0.631, green: 0.631, blue: 0.667))
                }
                if let name = entry.nextRaceName, let raceDate = entry.nextRaceDate {
                    Text("\(name) · \(raceDate)")
                        .font(.system(size: 9))
                        .foregroundStyle(Color(red: 0.631, green: 0.631, blue: 0.667))
                        .lineLimit(1)
                }
            }
            .padding(12)
        }
    }

    private var mediumView: some View {
        ZStack {
            Color(red: 0.035, green: 0.035, blue: 0.043)
            HStack(spacing: 16) {
                // Left: rank & points
                VStack(alignment: .leading, spacing: 4) {
                    Text("F1 Fantasy")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color(red: 0.882, green: 0.024, blue: 0))
                    Text(entry.leagueName)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Spacer()
                    if let rank = entry.myRank {
                        Text("P\(rank)")
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Text("\(entry.totalPoints) pts")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Color(red: 0.980, green: 0.620, blue: 0.043))
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                // Divider
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                    .frame(width: 1)

                // Right: next race
                VStack(alignment: .leading, spacing: 4) {
                    Text("NEXT RACE")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(Color(red: 0.631, green: 0.631, blue: 0.667))
                    if let name = entry.nextRaceName {
                        Text(name.replacingOccurrences(of: " Grand Prix", with: " GP"))
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                    } else {
                        Text("Season complete")
                            .font(.system(size: 12))
                            .foregroundStyle(Color(red: 0.631, green: 0.631, blue: 0.667))
                    }
                    if let date = entry.nextRaceDate {
                        Text(date)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Color(red: 0.980, green: 0.620, blue: 0.043))
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(14)
        }
    }
}

// MARK: - Widget Declaration

@main
struct F1FantasyWidget: Widget {
    let kind = "F1FantasyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: F1WidgetProvider()) { entry in
            F1WidgetEntryView(entry: entry)
                .containerBackground(Color(red: 0.035, green: 0.035, blue: 0.043), for: .widget)
        }
        .configurationDisplayName("F1 Fantasy")
        .description("Your rank, points, and next race at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
