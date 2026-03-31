import Foundation
import Observation

// MARK: - Past Run

struct PastRun: Codable, Identifiable {
    let id: UUID
    let date: Date
    let recipeNames: [String]
    let itemCount: Int
}

// MARK: - Weekly Plan Store

/// Shared observable state for the current weekly recipe selection and run history.
/// Injected into the environment at the app root so both HomeView and
/// RecipeListView always observe the same selection without binding gymnastics.
@Observable
final class WeeklyPlanStore {

    // MARK: - State

    var selectedRecipes: [UUID: Double] = [:]   // recipeID → targetServings
    var pastRuns: [PastRun] = []

    // MARK: - Keys

    private let selectionKey = "weeklySelection"
    private let pastRunsKey  = "weeklyPastRuns"

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

    // MARK: - Past Runs API

    func recordRun(recipeNames: [String], itemCount: Int) {
        guard !recipeNames.isEmpty else { return }
        let run = PastRun(id: UUID(), date: Date(), recipeNames: recipeNames, itemCount: itemCount)
        pastRuns.insert(run, at: 0)
        if pastRuns.count > 15 { pastRuns = Array(pastRuns.prefix(15)) }
        savePastRuns()
    }

    // MARK: - Persistence

    /// Call this in HomeView's .onAppear with the current set of recipe IDs
    /// to load selection state and strip stale entries.
    func load(validIDs: Set<UUID>) {
        if let data = UserDefaults.standard.data(forKey: selectionKey),
           let dict = try? JSONDecoder().decode([String: Double].self, from: data) {
            selectedRecipes = dict.reduce(into: [:]) { result, pair in
                if let uuid = UUID(uuidString: pair.key), validIDs.contains(uuid) {
                    result[uuid] = pair.value
                }
            }
        }
        if let data = UserDefaults.standard.data(forKey: pastRunsKey),
           let runs = try? JSONDecoder().decode([PastRun].self, from: data) {
            pastRuns = runs
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

    private func savePastRuns() {
        if let data = try? JSONEncoder().encode(pastRuns) {
            UserDefaults.standard.set(data, forKey: pastRunsKey)
        }
    }
}
