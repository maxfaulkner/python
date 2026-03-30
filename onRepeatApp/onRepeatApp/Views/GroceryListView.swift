import SwiftUI

struct GroceryListView: View {
    @Environment(\.dismiss) private var dismiss

    let selections: [(recipe: Recipe, targetServings: Double)]

    private var combinedIngredients: [CombinedIngredient] {
        IngredientCombiner.combine(selections)
    }

    private var recipeNames: String {
        selections.map { $0.recipe.name }.joined(separator: ", ")
    }

    private var shareText: String {
        var lines = ["Grocery List", "Recipes: \(recipeNames)", ""]
        for item in combinedIngredients {
            let unit = item.unit.isEmpty ? "" : " \(item.unit)"
            lines.append("• \(item.formattedQuantity)\(unit) \(item.name)")
        }
        return lines.joined(separator: "\n")
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text(recipeNames)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } header: {
                    Text("This Week's Recipes")
                }

                Section("Ingredients to Buy") {
                    if combinedIngredients.isEmpty {
                        Text("No ingredients found. Make sure your selected recipes have ingredients added.")
                            .foregroundStyle(.secondary)
                            .font(.subheadline)
                    } else {
                        ForEach(combinedIngredients) { item in
                            HStack(spacing: 0) {
                                Text(item.formattedQuantity)
                                    .monospacedDigit()
                                    .foregroundStyle(.secondary)
                                    .frame(width: 44, alignment: .trailing)
                                if !item.unit.isEmpty {
                                    Text(" \(item.unit)")
                                        .foregroundStyle(.secondary)
                                        .frame(width: 52, alignment: .leading)
                                } else {
                                    Spacer().frame(width: 8)
                                }
                                Text(item.name)
                                    .padding(.leading, item.unit.isEmpty ? 4 : 0)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Grocery List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(item: shareText) {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
        }
    }
}
