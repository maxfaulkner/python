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

// MARK: - Brand Colors

extension Color {
    /// Deep forest green — primary brand color
    static let brandGreen  = Color(hex: "2A5C45")
    /// Lighter sage — used for accents and highlights
    static let brandMid    = Color(hex: "4A9268")
    /// Warm cream — app background
    static let appBg       = Color(hex: "F7F6F3")
    /// Pure white — card backgrounds
    static let cardSurface = Color.white
    /// Warm amber — secondary accent
    static let brandAmber  = Color(hex: "E8A838")
}

// MARK: - Recipe Card Gradients

enum RecipeGradients {
    static let palettes: [[Color]] = [
        [Color(hex: "FF6B6B"), Color(hex: "E8425A")],  // coral-rose
        [Color(hex: "4FACFE"), Color(hex: "0090F5")],  // sky-blue
        [Color(hex: "11998E"), Color(hex: "38EF7D")],  // teal-mint
        [Color(hex: "FA8231"), Color(hex: "F7B731")],  // sunset-gold
        [Color(hex: "8E54E9"), Color(hex: "4776E6")],  // violet-indigo
        [Color(hex: "2A5C45"), Color(hex: "4A9268")],  // forest-sage (brand)
        [Color(hex: "F953C6"), Color(hex: "B91D73")],  // fuchsia-magenta
        [Color(hex: "56AB2F"), Color(hex: "A8E063")],  // lime-grass
        [Color(hex: "FF7043"), Color(hex: "FF8F00")],  // ember-amber
        [Color(hex: "1A237E"), Color(hex: "4776E6")],  // navy-blue
        [Color(hex: "AD1457"), Color(hex: "F06292")],  // raspberry-rose
        [Color(hex: "00695C"), Color(hex: "26C6DA")],  // deep-teal-cyan
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
