import SwiftUI

// MARK: - Hex Color Init

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:  (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:  (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:  (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r)/255, green: Double(g)/255, blue: Double(b)/255, opacity: Double(a)/255)
    }
}

// MARK: - Adaptive Color Helper

private extension Color {
    static func adaptive(light: UIColor, dark: UIColor) -> Color {
        Color(uiColor: UIColor(dynamicProvider: { $0.userInterfaceStyle == .dark ? dark : light }))
    }
}

// MARK: - Brand Colors

extension Color {
    /// Deep forest green — primary brand color (same in both modes)
    static let brandGreen  = Color(hex: "2A5C45")
    /// Lighter sage — gradient partner
    static let brandMid    = Color(hex: "4A9268")
    /// Warm amber — secondary accent
    static let brandAmber  = Color(hex: "E8A838")

    /// App-wide background — warm cream (light) / near-black (dark)
    static let appBg = adaptive(
        light: UIColor(red: 0.969, green: 0.965, blue: 0.953, alpha: 1),  // #F7F6F3
        dark:  UIColor(red: 0.071, green: 0.071, blue: 0.075, alpha: 1)   // #121213
    )

    /// Card surface — white (light) / dark charcoal (dark)
    static let cardSurface = adaptive(
        light: .white,
        dark:  UIColor(red: 0.110, green: 0.110, blue: 0.118, alpha: 1)   // #1C1C1E
    )

    /// Subtle elevated surface — checked rows, section fills
    static let surfaceSecondary = adaptive(
        light: UIColor(red: 0.949, green: 0.949, blue: 0.949, alpha: 1),  // #F2F2F2
        dark:  UIColor(red: 0.165, green: 0.165, blue: 0.165, alpha: 1)   // #2A2A2A
    )

    // MARK: - Semantic Text Colors

    /// Primary body text — near-black (light) / near-white (dark)
    static let textPrimary = adaptive(
        light: UIColor(red: 0.102, green: 0.102, blue: 0.102, alpha: 1),  // #1A1A1A
        dark:  UIColor(red: 0.941, green: 0.941, blue: 0.941, alpha: 1)   // #F0F0F0
    )

    /// Secondary supporting text — dark gray (light) / medium gray (dark)
    static let textSecondary = adaptive(
        light: UIColor(red: 0.333, green: 0.333, blue: 0.333, alpha: 1),  // #555555
        dark:  UIColor(red: 0.667, green: 0.667, blue: 0.667, alpha: 1)   // #AAAAAA
    )

    /// Tertiary hint/label text — medium gray (light) / subdued gray (dark)
    static let textTertiary = adaptive(
        light: UIColor(red: 0.533, green: 0.533, blue: 0.533, alpha: 1),  // #888888
        dark:  UIColor(red: 0.467, green: 0.467, blue: 0.467, alpha: 1)   // #777777
    )

    /// Disabled / very muted text
    static let textDisabled = adaptive(
        light: UIColor(red: 0.733, green: 0.733, blue: 0.733, alpha: 1),  // #BBBBBB
        dark:  UIColor(red: 0.267, green: 0.267, blue: 0.267, alpha: 1)   // #444444
    )

    /// Borders and separators
    static let borderColor = adaptive(
        light: UIColor(red: 0.800, green: 0.800, blue: 0.800, alpha: 1),  // #CCCCCC
        dark:  UIColor(red: 0.227, green: 0.227, blue: 0.227, alpha: 1)   // #3A3A3A
    )
}

// MARK: - Recipe Card Gradients

enum RecipeGradients {
    static let palettes: [[Color]] = [
        [Color(hex: "E8425A"), Color(hex: "C0224A")],  // coral-rose
        [Color(hex: "0090F5"), Color(hex: "0061B8")],  // sky-blue
        [Color(hex: "11998E"), Color(hex: "0B6E65")],  // deep-teal
        [Color(hex: "E06C1F"), Color(hex: "B84D00")],  // burnt-orange
        [Color(hex: "7B3FE4"), Color(hex: "4530A8")],  // violet-indigo
        [Color(hex: "2A5C45"), Color(hex: "1A3D2E")],  // forest-sage (brand)
        [Color(hex: "C2185B"), Color(hex: "880E4F")],  // magenta-rose
        [Color(hex: "388E3C"), Color(hex: "1B5E20")],  // deep-green
        [Color(hex: "E64A19"), Color(hex: "BF360C")],  // deep-ember
        [Color(hex: "283593"), Color(hex: "1A1F6B")],  // deep-navy
        [Color(hex: "AD1457"), Color(hex: "7B0038")],  // raspberry
        [Color(hex: "00695C"), Color(hex: "004D40")],  // deep-teal-dark
    ]

    static func gradient(for name: String) -> [Color] {
        palettes[abs(name.hashValue) % palettes.count]
    }

    static func linearGradient(for name: String) -> LinearGradient {
        LinearGradient(
            colors: gradient(for: name),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

// MARK: - Grocery Category (UI extensions)

extension GroceryCategory {
    var color: Color {
        switch self {
        case .produce:    return Color(hex: "43A047")
        case .dairy:      return Color(hex: "1E88E5")
        case .meat:       return Color(hex: "E53935")
        case .bakery:     return Color(hex: "FB8C00")
        case .grains:     return Color(hex: "F9A825")
        case .canned:     return Color(hex: "6D4C41")
        case .spices:     return Color(hex: "8E24AA")
        case .condiments: return Color(hex: "F4511E")
        case .beverages:  return Color(hex: "00ACC1")
        case .frozen:     return Color(hex: "3949AB")
        case .other:      return Color(hex: "757575")
        }
    }

    var systemImage: String {
        switch self {
        case .produce:    return "leaf.fill"
        case .dairy:      return "drop.fill"
        case .meat:       return "fork.knife"
        case .bakery:     return "birthday.cake.fill"
        case .grains:     return "square.stack.fill"
        case .canned:     return "cylinder.split.1x2.fill"
        case .spices:     return "sparkles"
        case .condiments: return "waterbottle.fill"
        case .beverages:  return "cup.and.saucer.fill"
        case .frozen:     return "snowflake"
        case .other:      return "cart.fill"
        }
    }
}

// MARK: - Recipe Emoji Mapper

enum RecipeEmojiMapper {
    static func emoji(name: String, tags: [String]) -> String {
        let all = ([name] + tags).joined(separator: " ")
        let checks: [(String, String)] = [
            ("breakfast|waffle|pancake|omelette|oatmeal|cereal|frittata", "🍳"),
            ("pasta|spaghetti|linguine|fettuccine|rigatoni|penne|carbonara|bolognese|lasagna", "🍝"),
            ("soup|stew|chowder|bisque|broth|ramen|pho", "🍲"),
            ("salad|slaw|caesar|caprese", "🥗"),
            ("pizza|flatbread|focaccia", "🍕"),
            ("cake|cookie|brownie|dessert|sweet|pie|tart|muffin|cupcake|bread pudding", "🍰"),
            ("chicken|poultry|wing|drumstick|thigh|breast", "🍗"),
            ("fish|salmon|tuna|cod|halibut|tilapia|shrimp|seafood|prawn|scallop|lobster|crab", "🐟"),
            ("beef|steak|brisket|burger|meatball|meatloaf|ground beef", "🥩"),
            ("taco|burrito|quesadilla|enchilada|fajita|mexican|tex-mex", "🌮"),
            ("sandwich|wrap|sub|panini|grilled cheese|blt", "🥪"),
            ("rice|risotto|fried rice|paella", "🍚"),
            ("noodle|stir fry|asian|thai|chinese|japanese|korean|wok|curry|tikka|masala|indian", "🍜"),
            ("vegetarian|vegan|plant|veggie", "🥦"),
            ("smoothie|shake|drink|juice|cocktail|mocktail", "🥤"),
            ("egg|deviled", "🥚"),
            ("corn|elote", "🌽"),
            ("mushroom", "🍄"),
            ("avocado|guacamole", "🥑"),
        ]
        for (pattern, emoji) in checks {
            if let _ = all.range(of: pattern, options: [.regularExpression, .caseInsensitive]) {
                return emoji
            }
        }
        return "🍽"
    }
}

// MARK: - Cuisine Helper

enum CuisineHelper {
    static let knownCuisines: Set<String> = [
        "italian", "indian", "chinese", "mexican", "french", "japanese",
        "middle eastern", "american", "west african", "nordic", "thai",
        "greek", "vietnamese", "korean", "spanish", "mediterranean"
    ]

    /// Returns the most frequent cuisine tag from a list of tag names, or nil if none match.
    static func cuisine(from tags: [String]) -> String? {
        let lowered = tags.map { $0.lowercased() }
        let cuisineTags = lowered.filter { knownCuisines.contains($0) }
        guard !cuisineTags.isEmpty else { return nil }
        // Most frequent
        let counts = Dictionary(grouping: cuisineTags, by: { $0 }).mapValues(\.count)
        return counts.max(by: { $0.value < $1.value })?.key.capitalized
    }

    /// Returns all cuisine tags present in a list of tag names, sorted.
    static func cuisines(from tags: [String]) -> [String] {
        let lowered = tags.map { $0.lowercased() }
        return Array(Set(lowered.filter { knownCuisines.contains($0) })).sorted().map(\.capitalized)
    }
}

// MARK: - View Modifiers

struct CardSurface: ViewModifier {
    var radius: CGFloat = 16
    var shadowOpacity: Double = 0.06

    func body(content: Content) -> some View {
        content
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: radius))
            .shadow(color: .black.opacity(shadowOpacity), radius: 12, x: 0, y: 3)
    }
}

extension View {
    func cardSurface(radius: CGFloat = 16, shadowOpacity: Double = 0.06) -> some View {
        modifier(CardSurface(radius: radius, shadowOpacity: shadowOpacity))
    }
}

// MARK: - Double Display Helper

extension Double {
    var displayString: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.2g", self)
    }
}
