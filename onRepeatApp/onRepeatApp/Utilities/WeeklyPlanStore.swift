import Foundation
import Observation

// MARK: - Weekly Plan Store

/// Shared observable state for the current weekly recipe selection (the "builder").
/// Injected into the environment at the app root so both HomeView and RecipeListView
/// always observe the same selection without binding gymnastics.
/// Past list history is now stored as GroceryList SwiftData objects.
@Observable
final class WeeklyPlanStore {

    // MARK: - State

    var selectedRecipes: [UUID: Double] = [:]   // recipeID → targetServings

    // MARK: - Key

    private let selectionKey = "weeklySelection"

    // MARK: - Selection API

    func isSelected(_ id: UUID) -> Bool {
        selectedRecipes[id] != nil
    }

    func targetServings(for id: UUID, defaultServings: Double) -> Double {
        selectedRecipes[id] ?? defaultServings
    }

    func toggle(_ recipe: Recipe) {
        if selectedRecipes[recipe.id] != nil {
            selectedRecipes.removeValue(forKey: recipe.id)
        } else {
            selectedRecipes[recipe.id] = recipe.servings
        }
        saveSelection()
    }

    func setServings(_ servings: Double, for id: UUID) {
        guard selectedRecipes[id] != nil else { return }
        selectedRecipes[id] = servings
        saveSelection()
    }

    func clearAll() {
        selectedRecipes.removeAll()
        saveSelection()
    }

    func remove(id: UUID) {
        selectedRecipes.removeValue(forKey: id)
        saveSelection()
    }

    // MARK: - Persistence

    /// Call in HomeView's .onAppear with the current set of recipe IDs
    /// to load selection state and strip stale entries.
    func load(validIDs: Set<UUID>) {
        guard let data = UserDefaults.standard.data(forKey: selectionKey),
              let dict = try? JSONDecoder().decode([String: Double].self, from: data)
        else { return }
        selectedRecipes = dict.reduce(into: [:]) { result, pair in
            if let uuid = UUID(uuidString: pair.key), validIDs.contains(uuid) {
                result[uuid] = pair.value
            }
        }
    }

    private func saveSelection() {
        let dict = selectedRecipes.reduce(into: [String: Double]()) {
            $0[$1.key.uuidString] = $1.value
        }
        if let data = try? JSONEncoder().encode(dict) {
            UserDefaults.standard.set(data, forKey: selectionKey)
        }
    }
}
