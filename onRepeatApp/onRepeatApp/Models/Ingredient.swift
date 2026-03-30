import Foundation
import SwiftData

@Model
class Ingredient {
    var id: UUID
    var quantity: Double
    var unit: String
    var name: String
    var recipe: Recipe?

    init(quantity: Double, unit: String, name: String) {
        self.id = UUID()
        self.quantity = quantity
        self.unit = unit.trimmingCharacters(in: .whitespaces)
        self.name = name.lowercased().trimmingCharacters(in: .whitespaces)
    }
}
