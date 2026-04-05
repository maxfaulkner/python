import SwiftUI

// MARK: - Color Hex Init

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }

    // Adaptive color: one value for dark mode, another for light mode
    init(dark: String, light: String) {
        self.init(UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(Color(hex: dark))
                : UIColor(Color(hex: light))
        })
    }
}

// MARK: - Design Tokens

extension Color {
    static let appBackground  = Color(dark: "09090b", light: "f4f4f5")
    static let appCard        = Color(dark: "1e1e22", light: "ffffff")
    static let appCardRaised  = Color(dark: "27272a", light: "e4e4e7")
    static let appRed         = Color(hex: "e10600")
    static let appGold        = Color(hex: "f59e0b")
    static let appTextPrimary = Color(dark: "fafafa", light: "09090b")
    static let appTextDim     = Color(dark: "a1a1aa", light: "52525b")
    static let appTextFaint   = Color(dark: "52525b", light: "a1a1aa")
    static let appBorder      = Color(dark: "ffffff", light: "000000").opacity(0.08)
    static let appSuccess     = Color(hex: "22c55e")
    static let appError       = Color(hex: "f87171")
}

// MARK: - ShapeStyle extensions (enables .appRed shorthand in .foregroundStyle())

extension ShapeStyle where Self == Color {
    static var appBackground:  Color { .appBackground }
    static var appCard:        Color { .appCard }
    static var appCardRaised:  Color { .appCardRaised }
    static var appRed:         Color { .appRed }
    static var appGold:        Color { .appGold }
    static var appTextPrimary: Color { .appTextPrimary }
    static var appTextDim:     Color { .appTextDim }
    static var appTextFaint:   Color { .appTextFaint }
    static var appSuccess:     Color { .appSuccess }
    static var appError:       Color { .appError }
}

// MARK: - F1 Constructor Colors (2026)

let constructorColors: [String: Color] = [
    "Red Bull":       Color(hex: "3671C6"),
    "Ferrari":        Color(hex: "E8002D"),
    "McLaren":        Color(hex: "FF8000"),
    "Mercedes":       Color(hex: "27F4D2"),
    "Aston Martin":   Color(hex: "229971"),
    "Alpine":         Color(hex: "FF87BC"),
    "Williams":       Color(hex: "64C4FF"),
    "Racing Bulls":   Color(hex: "6692FF"),
    "Haas":           Color(hex: "B6BABD"),
    "Kick Sauber":    Color(hex: "52E252"),
]

func constructorColor(for name: String?) -> Color {
    guard let name else { return .appTextDim }
    return constructorColors.first(where: { name.contains($0.key) })?.value ?? .appTextDim
}
