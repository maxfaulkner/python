import Foundation

struct CombinedIngredient: Identifiable {
    let id = UUID()
    let quantity: Double
    let unit: String
    let name: String

    var formattedQuantity: String {
        if quantity.truncatingRemainder(dividingBy: 1) == 0 {
            return String(Int(quantity))
        }
        let s = String(format: "%.2f", quantity)
        return s.replacingOccurrences(of: #"\.?0+$"#, with: "", options: .regularExpression)
    }
}

enum IngredientCombiner {
    private static let unitAliases: [String: String] = [
        "cup": "cup", "cups": "cup",
        "tablespoon": "tbsp", "tablespoons": "tbsp", "tbsp": "tbsp",
        "teaspoon": "tsp", "teaspoons": "tsp", "tsp": "tsp",
        "ounce": "oz", "ounces": "oz", "oz": "oz",
        "pound": "lb", "pounds": "lb", "lb": "lb", "lbs": "lb",
        "gram": "g", "grams": "g", "g": "g",
        "kilogram": "kg", "kilograms": "kg", "kg": "kg",
        "milliliter": "ml", "milliliters": "ml", "ml": "ml",
        "liter": "l", "liters": "l", "l": "l",
        "clove": "clove", "cloves": "clove",
        "can": "can", "cans": "can",
        "pinch": "pinch", "pinches": "pinch",
    ]

    static func normalizeUnit(_ unit: String) -> String {
        let lower = unit.lowercased().trimmingCharacters(in: .whitespaces)
        return unitAliases[lower] ?? lower
    }

    static func combine(_ selections: [(recipe: Recipe, targetServings: Double)]) -> [CombinedIngredient] {
        var totals: [String: Double] = [:]
        var meta: [String: (unit: String, name: String)] = [:]

        for (recipe, targetServings) in selections {
            guard recipe.servings > 0 else { continue }
            let scale = targetServings / recipe.servings
            for ingredient in recipe.ingredients {
                let unit = normalizeUnit(ingredient.unit)
                let name = ingredient.name.lowercased().trimmingCharacters(in: .whitespaces)
                let key = "\(unit)|\(name)"
                totals[key, default: 0] += ingredient.quantity * scale
                meta[key] = (unit: unit, name: name)
            }
        }

        return totals.compactMap { key, qty in
            guard let m = meta[key] else { return nil }
            return CombinedIngredient(quantity: qty, unit: m.unit, name: m.name)
        }
        .sorted {
            if $0.unit.isEmpty != $1.unit.isEmpty { return !$0.unit.isEmpty }
            if $0.unit != $1.unit { return $0.unit < $1.unit }
            return $0.name < $1.name
        }
    }
}
