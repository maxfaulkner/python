import Foundation
import SwiftData

// MARK: - Saved Grocery Item (snapshot)

/// A point-in-time snapshot of one combined ingredient row.
/// Stored as JSON in GroceryList so the list is self-contained even if
/// the underlying recipes are later edited or deleted.
struct SavedGroceryItem: Codable, Identifiable {
    let id: UUID
    let quantity: Double
    let unit: String
    let name: String
    let categoryRaw: String         // GroceryCategory.rawValue
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

// MARK: - GroceryList Model

@Model
class GroceryList {

    // MARK: Stored

    var id: UUID
    var name: String
    var createdAt: Date
    var recipeNames: [String]       // display; cached at creation
    var snapshotItemCount: Int      // count of recipe-derived items at creation
    var itemsJSON: Data             // JSON [SavedGroceryItem]
    var checkedKeys: [String]       // toggled item keys
    var manualItemsJSON: Data       // JSON [GroceryManualItem]
    var isCompleted: Bool

    // MARK: Init

    init(name: String, recipeNames: [String], items: [SavedGroceryItem]) {
        self.id                = UUID()
        self.name              = name
        self.createdAt         = Date()
        self.recipeNames       = recipeNames
        self.snapshotItemCount = items.count
        self.itemsJSON         = (try? JSONEncoder().encode(items)) ?? Data()
        self.checkedKeys       = []
        self.manualItemsJSON   = Data()
        self.isCompleted       = false
    }

    // MARK: Computed helpers

    var items: [SavedGroceryItem] {
        (try? JSONDecoder().decode([SavedGroceryItem].self, from: itemsJSON)) ?? []
    }

    var manualItems: [GroceryManualItem] {
        (try? JSONDecoder().decode([GroceryManualItem].self, from: manualItemsJSON)) ?? []
    }

    var totalItemCount: Int { snapshotItemCount + manualItems.count }
    var checkedCount: Int { checkedKeys.count }
    var progress: Double { totalItemCount == 0 ? 0 : Double(checkedCount) / Double(totalItemCount) }

    // MARK: Mutation helpers called from the view

    func saveManualItems(_ items: [GroceryManualItem]) {
        manualItemsJSON = (try? JSONEncoder().encode(items)) ?? Data()
        snapshotItemCount = self.items.count   // recipe items stay the same
    }
}

// MARK: - Factory

extension GroceryList {
    /// Creates, inserts, and returns a GroceryList from a live selection,
    /// snapshotting the combined ingredient list at this moment in time.
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
        let list = GroceryList(
            name: name,
            recipeNames: selections.map(\.recipe.name),
            items: items
        )
        context.insert(list)
        try? context.save()
        return list
    }
}
