import SwiftUI
import SwiftData

struct RecipeListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Recipe.createdAt, order: .reverse) private var recipes: [Recipe]

    @State private var selectedRecipes: [UUID: Double] = [:]
    @State private var showingAddRecipe = false
    @State private var showingGroceryList = false

    var body: some View {
        NavigationStack {
            Group {
                if recipes.isEmpty {
                    emptyState
                } else {
                    List {
                        ForEach(recipes) { recipe in
                            RecipeRow(recipe: recipe, selectedServings: servingsBinding(for: recipe))
                        }
                    }
                }
            }
            .navigationTitle("onRepeat")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showingAddRecipe = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                if !selectedRecipes.isEmpty {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Clear") {
                            selectedRecipes.removeAll()
                        }
                        .foregroundStyle(.secondary)
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                if !selectedRecipes.isEmpty {
                    Button {
                        showingGroceryList = true
                    } label: {
                        Label(
                            "Generate Grocery List  ·  \(selectedRecipes.count) recipe\(selectedRecipes.count == 1 ? "" : "s")",
                            systemImage: "cart.fill"
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.accentColor)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 8)
                    .background(.ultraThinMaterial)
                }
            }
            .sheet(isPresented: $showingAddRecipe) {
                RecipeFormView(mode: .new)
            }
            .sheet(isPresented: $showingGroceryList) {
                GroceryListView(selections: grocerySelections)
            }
        }
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label("No Recipes Yet", systemImage: "fork.knife")
        } description: {
            Text("Tap + to add your first recipe.")
        } actions: {
            Button("Add Recipe") { showingAddRecipe = true }
                .buttonStyle(.borderedProminent)
        }
    }

    private func servingsBinding(for recipe: Recipe) -> Binding<Double?> {
        Binding(
            get: { selectedRecipes[recipe.id] },
            set: { newValue in
                if let value = newValue {
                    selectedRecipes[recipe.id] = value
                } else {
                    selectedRecipes.removeValue(forKey: recipe.id)
                }
            }
        )
    }

    private var grocerySelections: [(recipe: Recipe, targetServings: Double)] {
        recipes.compactMap { recipe in
            guard let servings = selectedRecipes[recipe.id] else { return nil }
            return (recipe: recipe, targetServings: servings)
        }
    }
}

// MARK: - Recipe Row

private struct RecipeRow: View {
    let recipe: Recipe
    @Binding var selectedServings: Double?

    private var isSelected: Bool { selectedServings != nil }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 12) {
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        if isSelected {
                            selectedServings = nil
                        } else {
                            selectedServings = recipe.servings
                        }
                    }
                } label: {
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundStyle(isSelected ? Color.accentColor : Color.secondary)
                }
                .buttonStyle(.plain)

                NavigationLink(destination: RecipeDetailView(recipe: recipe)) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(recipe.name)
                            .font(.body)
                            .foregroundStyle(.primary)
                        HStack(spacing: 4) {
                            Text("\(recipe.servings.formatted()) servings")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            if !recipe.tags.isEmpty {
                                Text("·")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                Text(recipe.tags.map(\.name).sorted().joined(separator: ", "))
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }

            if isSelected {
                HStack(spacing: 8) {
                    Spacer().frame(width: 36)
                    Text("Servings for this run:")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Stepper(
                        value: Binding(
                            get: { selectedServings ?? recipe.servings },
                            set: { selectedServings = $0 }
                        ),
                        in: 0.5...100,
                        step: 0.5
                    ) {
                        Text((selectedServings ?? recipe.servings).formatted())
                            .monospacedDigit()
                            .font(.subheadline)
                            .frame(minWidth: 30, alignment: .trailing)
                    }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
        .padding(.vertical, 4)
    }
}

private extension Double {
    func formatted() -> String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.1f", self)
    }
}
