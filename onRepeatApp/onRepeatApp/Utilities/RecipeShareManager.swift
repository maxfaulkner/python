import Foundation
import CoreImage
import UIKit

// MARK: - Shareable Payload

struct SharedRecipePayload: Codable {
    let version: Int
    let name: String
    let servings: Double
    let instructions: String
    let ingredients: [SharedIngredientPayload]
    let tags: [String]
}

struct SharedIngredientPayload: Codable {
    let quantity: Double
    let unit: String
    let name: String
}

// MARK: - Share Manager

enum RecipeShareManager {
    static let urlScheme = "onrepeat"
    static let payloadVersion = 1

    // MARK: Encode → URL

    static func shareURL(for recipe: Recipe) -> URL? {
        let payload = SharedRecipePayload(
            version: payloadVersion,
            name: recipe.name,
            servings: recipe.servings,
            instructions: recipe.instructions,
            ingredients: recipe.ingredients.map {
                SharedIngredientPayload(quantity: $0.quantity, unit: $0.unit, name: $0.name)
            },
            tags: recipe.tags.map(\.name).sorted()
        )
        guard let data = try? JSONEncoder().encode(payload) else { return nil }
        let base64 = data.base64EncodedString()
        guard let encoded = base64.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) else { return nil }
        return URL(string: "\(urlScheme)://recipe?v=\(payloadVersion)&d=\(encoded)")
    }

    static func shareText(for recipe: Recipe) -> String {
        var lines = ["🍽 \(recipe.name)", ""]
        if !recipe.ingredients.isEmpty {
            lines.append("Ingredients:")
            for ing in recipe.ingredients {
                let unit = ing.unit.isEmpty ? "" : " \(ing.unit)"
                lines.append("  • \(ing.quantity.shareString)\(unit) \(ing.name)")
            }
            lines.append("")
        }
        if !recipe.instructions.isEmpty {
            lines.append("Instructions:")
            lines.append(recipe.instructions)
            lines.append("")
        }
        if let url = shareURL(for: recipe) {
            lines.append("Import into onRepeat: \(url.absoluteString)")
        }
        return lines.joined(separator: "\n")
    }

    // MARK: QR Code

    static func qrCode(for recipe: Recipe, size: CGFloat = 280) -> UIImage? {
        guard let url = shareURL(for: recipe),
              let data = url.absoluteString.data(using: .ascii),
              let filter = CIFilter(name: "CIQRCodeGenerator") else { return nil }
        filter.setValue(data, forKey: "inputMessage")
        filter.setValue("M", forKey: "inputCorrectionLevel")
        guard let output = filter.outputImage else { return nil }
        let scale = size / output.extent.width
        let scaled = output.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        let context = CIContext()
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }

    // MARK: Decode ← URL

    static func decode(url: URL) -> SharedRecipePayload? {
        guard url.scheme?.lowercased() == urlScheme,
              url.host == "recipe",
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let dataParam = components.queryItems?.first(where: { $0.name == "d" })?.value,
              let data = Data(base64Encoded: dataParam) else { return nil }
        return try? JSONDecoder().decode(SharedRecipePayload.self, from: data)
    }
}

private extension Double {
    var shareString: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.2f", self)
    }
}
