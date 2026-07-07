import Foundation
import WidgetKit

/// Writes league data into the shared App Group UserDefaults so the widget can display it.
/// Call `WidgetDataWriter.update(...)` after leaderboard or league data loads.
/// Requires App Group "group.com.maxfaulkner.f1fantasy" on both targets.
enum WidgetDataWriter {
    private static let suiteName = "group.com.maxfaulkner.f1fantasy"

    static func update(
        leagueName: String,
        myRank: Int?,
        totalPoints: Int,
        nextRaceName: String?,
        nextRaceDate: String?
    ) {
        let defaults = UserDefaults(suiteName: suiteName)
        defaults?.set(leagueName, forKey: "widget_league_name")
        if let rank = myRank { defaults?.set(rank, forKey: "widget_my_rank") }
        defaults?.set(totalPoints, forKey: "widget_total_points")
        defaults?.set(nextRaceName, forKey: "widget_next_race_name")
        defaults?.set(nextRaceDate, forKey: "widget_next_race_date")
        WidgetCenter.shared.reloadAllTimelines()
    }
}
