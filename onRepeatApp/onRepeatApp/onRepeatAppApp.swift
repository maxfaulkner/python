import SwiftUI
import SwiftData

@main
struct onRepeatAppApp: App {
    var body: some Scene {
        WindowGroup {
            RecipeListView()
        }
        .modelContainer(for: [Recipe.self, Ingredient.self, Tag.self])
    }
}
