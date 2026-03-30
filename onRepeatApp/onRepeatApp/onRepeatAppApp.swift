import SwiftUI
import SwiftData

@main
struct onRepeatAppApp: App {
    @State private var pendingImport: SharedRecipePayload? = nil
    @State private var showingImport = false

    var body: some Scene {
        WindowGroup {
            RecipeListView()
                .onOpenURL { url in
                    if let payload = RecipeShareManager.decode(url: url) {
                        pendingImport = payload
                        showingImport = true
                    }
                }
                .sheet(isPresented: $showingImport) {
                    if let payload = pendingImport {
                        ImportPreviewView(payload: payload)
                    }
                }
        }
        .modelContainer(for: [Recipe.self, Ingredient.self, Tag.self])
    }
}
