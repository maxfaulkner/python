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
}

// MARK: - Design Tokens

extension Color {
    static let appBackground  = Color(hex: "09090b")
    static let appCard        = Color(hex: "1e1e22")
    static let appCardRaised  = Color(hex: "27272a")
    static let appRed         = Color(hex: "e10600")
    static let appGold        = Color(hex: "f59e0b")
    static let appTextPrimary = Color(hex: "fafafa")
    static let appTextDim     = Color(hex: "a1a1aa")
    static let appTextFaint   = Color(hex: "52525b")
    static let appBorder      = Color.white.opacity(0.06)
    static let appSuccess     = Color(hex: "22c55e")
    static let appError       = Color(hex: "f87171")
}

// MARK: - ShapeStyle extensions (enables .appRed shorthand in .foregroundStyle())

extension ShapeStyle where Self == Color {
    static var appBackground:  Color { .init(hex: "09090b") }
    static var appCard:        Color { .init(hex: "1e1e22") }
    static var appCardRaised:  Color { .init(hex: "27272a") }
    static var appRed:         Color { .init(hex: "e10600") }
    static var appGold:        Color { .init(hex: "f59e0b") }
    static var appTextPrimary: Color { .init(hex: "fafafa") }
    static var appTextDim:     Color { .init(hex: "a1a1aa") }
    static var appTextFaint:   Color { .init(hex: "52525b") }
    static var appSuccess:     Color { .init(hex: "22c55e") }
    static var appError:       Color { .init(hex: "f87171") }
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