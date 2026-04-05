import Foundation
import SwiftData

// MARK: - Saved Grocery Item (snapshot)

struct SavedGroceryItem: Codable, Identifiable {
    let id: UUID
    let quantity: Double
    let unit: String
    let name: String
    let categoryRaw: String
    let sources: [String]

    var category: GroceryCategory { GroceryCategory(rawValue: categoryRaw) ?? .other }

    var formattedQuantity: String {
        guard quantity > 0 else { return "" }
        if quantity.truncatingRemainder(dividingBy: 1) == 0 { return String(Int(quantity)) }
        let s = String(format: "%.2f", quantity)
        var r = s
        while r.hasSuffix("0") { r.removeLast() }
        if r.hasSuffix(".") { r.removeLast() }
        return r
    }
}

// MARK: - Grocery Manual Item

struct GroceryManualItem: Codable, Identifiable {
    let id: UUID
    var name: String
}

// MARK: - Codable JSON helpers

private func encodeJSON<T: Encodable>(_ value: T) -> String {
    guard let data = try? JSONEncoder().encode(value),
          let str = String(data: data, encoding: .utf8) else { return "[]" }
    return str
}

private func decodeJSON<T: Decodable>(_ string: String) -> [T] {
    guard let data = string.data(using: .utf8) else { return [] }
    return (try? JSONDecoder().decode([T].self, from: data)) ?? []
}

// MARK: - GroceryList Model

@Model
class GroceryList {

    var id: UUID
    var name: String
    var createdAt: Date
    var recipeNames: [String]
    var snapshotItemCount: Int
    var itemsJSONString: String      // JSON string — @Model handles String fine
    var checkedKeys: [String]
    var manualItemsJSONString: String
    var isCompleted: Bool

    init(name: String, recipeNames: [String], items: [SavedGroceryItem]) {
        self.id                    = UUID()
        self.name                  = name
        self.createdAt             = Date()
        self.recipeNames           = recipeNames
        self.snapshotItemCount     = items.count
        self.itemsJSONString       = encodeJSON(items)
        self.checkedKeys           = []
        self.manualItemsJSONString = "[]"
        self.isCompleted           = false
    }

    // MARK: - Decoded views (not persisted by SwiftData)

    var items: [SavedGroceryItem] { decodeJSON(itemsJSONString) }
    var manualItems: [GroceryManualItem] { decodeJSON(manualItemsJSONString) }

    var totalItemCount: Int { snapshotItemCount + manualItems.count }
    var checkedCount: Int { checkedKeys.count }
    var progress: Double { totalItemCount == 0 ? 0 : Double(checkedCount) / Double(totalItemCount) }
}

// MARK: - Factory

extension GroceryList {
    static func create(
        name: String,
        from selections: [(recipe: Recipe, targetServings: Double)],
        in context: ModelContext
    ) -> GroceryList {
        let combined = IngredientCombiner.combine(selections)
        let items = combined.map { ci in
            SavedGroceryItem(
                id: UUID(),
                quantity: ci.quantity,
                unit: ci.unit,
                name: ci.name,
                categoryRaw: ci.category.rawValue,
                sources: ci.sources
            )
        }
        let list = GroceryList(name: name, recipeNames: selections.map(\.recipe.name), items: items)
        context.insert(list)
        try? context.save()
        return list
    }
}
