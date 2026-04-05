import SwiftUI
import SwiftData

@main
struct onRepeatAppApp: App {
    @State private var weeklyPlan = WeeklyPlanStore()
    @State private var authStore = AuthStore()
    @State private var pendingImport: SharedRecipePayload? = nil
    @State private var showingImport = false

    var body: some Scene {
        WindowGroup {
            Group {
                if authStore.isLoggedIn {
                    HomeView()
                        .environment(weeklyPlan)
                        .environment(authStore)
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
                } else {
                    LoginView()
                        .environment(authStore)
                }
            }
        }
        .modelContainer(for: [Recipe.self, Ingredient.self, Tag.self, GroceryList.self, User.self])
    }
}
