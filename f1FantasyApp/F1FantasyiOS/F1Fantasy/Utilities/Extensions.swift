import SwiftUI

// MARK: - View Modifiers

extension View {
    func cardStyle(padding: CGFloat = 16) -> some View {
        self
            .padding(padding)
            .background(Color.appCard)
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    func cardBorder() -> some View {
        self.overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.appBorder, lineWidth: 1)
        )
    }
}

// MARK: - Date

extension Date {
    var relativeString: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: self, relativeTo: .now)
    }

    var timeString: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: self)
    }

    var dateString: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: self)
    }
}

// MARK: - Double (prices)

extension Double {
    var priceString: String { "$\(String(format: "%.1f", self))M" }
}

// MARK: - Chip helpers

func chipEmoji(_ chip: String) -> String {
    switch chip {
    case "wildcard":       return "🃏"
    case "triple_captain": return "3️⃣"
    case "no_negative":    return "🛡"
    case "bench_boost":    return "⚡️"
    default:               return "✨"
    }
}

func chipName(_ chip: String) -> String {
    switch chip {
    case "wildcard":       return "Wildcard"
    case "triple_captain": return "Triple Captain"
    case "no_negative":    return "No Negative"
    case "bench_boost":    return "Bench Boost"
    default:               return chip.capitalized
    }
}