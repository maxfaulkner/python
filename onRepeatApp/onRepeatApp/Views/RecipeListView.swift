import SwiftUI
import SwiftData

struct RecipeListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Recipe.createdAt, order: .reverse) private var recipes: [Recipe]

    @State private var selectedRecipes: [UUID: Double] = [:]
    @State private var showingAddRecipe = false
    @State private var showingGroceryList = false
    @State private var searchText = ""
    @State private var activeTagFilter: String? = nil

    // MARK: - Computed

    private var allTags: [String] {
        Array(Set(recipes.flatMap { $0.tags.map(\.name) })).sorted()
    }

    private var filteredRecipes: [Recipe] {
        var result = recipes
        if !searchText.isEmpty {
            result = result.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.tags.contains { $0.name.localizedCaseInsensitiveContains(searchText) } ||
                $0.ingredients.contains { $0.name.localizedCaseInsensitiveContains(searchText) }
            }
        }
        if let tag = activeTagFilter {
            result = result.filter { $0.tags.contains { $0.name == tag } }
        }
        return result
    }

    private var grocerySelections: [(recipe: Recipe, targetServings: Double)] {
        recipes.compactMap { r in
            guard let s = selectedRecipes[r.id] else { return nil }
            return (recipe: r, targetServings: s)
        }
    }

    private var selectionCount: Int { selectedRecipes.count }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Color.appBg.ignoresSafeArea()

                VStack(spacing: 0) {
                    // Selection banner — only shown when recipes are selected
                    if selectionCount > 0 {
                        selectionBanner
                            .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    ScrollView {
                        LazyVStack(spacing: 10) {
                            if !allTags.isEmpty {
                                tagFilterRow.padding(.top, 4)
                            }

                            if filteredRecipes.isEmpty {
                                emptyState.padding(.top, 60)
                            } else {
                                // Hint text on first load
                                if selectionCount == 0 && searchText.isEmpty && activeTagFilter == nil {
                                    hintBanner
                                }

                                ForEach(filteredRecipes) { recipe in
                                    RecipeCardView(
                                        recipe: recipe,
                                        isSelected: selectedRecipes[recipe.id] != nil,
                                        targetServings: selectedRecipes[recipe.id] ?? recipe.servings,
                                        onToggleSelect: { toggleSelect(recipe) },
                                        onServingsChange: { selectedRecipes[recipe.id] = $0 }
                                    )
                                    .padding(.horizontal, 16)
                                }
                            }

                            Spacer(minLength: selectionCount > 0 ? 110 : 24)
                        }
                    }
                    .searchable(
                        text: $searchText,
                        placement: .navigationBarDrawer(displayMode: .automatic),
                        prompt: "Search recipes, ingredients, tags…"
                    )
                }

                // Grocery list CTA
                if selectionCount > 0 {
                    groceryCTA
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle("onRepeat")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.light, for: .navigationBar)
            .onAppear { SeedData.seedIfNeeded(context: modelContext) }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showingAddRecipe = true } label: {
                        ZStack {
                            Circle().fill(Color.brandGreen).frame(width: 32, height: 32)
                            Image(systemName: "plus")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }
                }
            }
            .navigationDestination(for: Recipe.self) { RecipeDetailView(recipe: $0) }
            .sheet(isPresented: $showingAddRecipe) { RecipeFormView(mode: .new) }
            .sheet(isPresented: $showingGroceryList) { GroceryListView(selections: grocerySelections) }
            .animation(.spring(response: 0.3), value: selectionCount)
        }
    }

    // MARK: - Selection Banner

    private var selectionBanner: some View {
        HStack {
            Image(systemName: "cart.fill")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.brandGreen)
            Text("\(selectionCount) recipe\(selectionCount == 1 ? "" : "s") selected")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Color(hex: "1A1A1A"))
            Spacer()
            Button("Clear all") {
                withAnimation(.spring(response: 0.3)) { selectedRecipes.removeAll() }
            }
            .font(.system(size: 13))
            .foregroundStyle(Color(hex: "888888"))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(Color.brandGreen.opacity(0.08))
    }

    // MARK: - Hint Banner

    private var hintBanner: some View {
        HStack(spacing: 8) {
            Image(systemName: "hand.tap.fill")
                .font(.system(size: 13))
                .foregroundStyle(Color.brandGreen)
            Text("Tap recipes to add them to your grocery list")
                .font(.system(size: 13))
                .foregroundStyle(Color(hex: "666666"))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Tag Filter

    private var tagFilterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                tagChip("All", active: activeTagFilter == nil) {
                    withAnimation(.easeInOut(duration: 0.18)) { activeTagFilter = nil }
                }
                ForEach(allTags, id: \.self) { tag in
                    tagChip(tag, active: activeTagFilter == tag) {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            activeTagFilter = activeTagFilter == tag ? nil : tag
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
        }
    }

    private func tagChip(_ label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: active ? .semibold : .regular))
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(active ? Color.brandGreen : Color.white)
                .foregroundStyle(active ? .white : Color(hex: "444444"))
                .clipShape(Capsule())
                .shadow(color: active ? Color.brandGreen.opacity(0.3) : Color.black.opacity(0.06),
                        radius: active ? 6 : 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(Color.brandGreen.opacity(0.1)).frame(width: 80, height: 80)
                Text("🍽").font(.system(size: 40))
            }
            VStack(spacing: 6) {
                Text(searchText.isEmpty && activeTagFilter == nil
                     ? "No recipes yet"
                     : "No matches found")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(Color(hex: "1A1A1A"))
                Text(searchText.isEmpty && activeTagFilter == nil
                     ? "Tap + to add your first recipe."
                     : "Try a different search or filter.")
                    .font(.system(size: 15))
                    .foregroundStyle(Color(hex: "888888"))
                    .multilineTextAlignment(.center)
            }
            if searchText.isEmpty && activeTagFilter == nil {
                Button { showingAddRecipe = true } label: {
                    Label("Add Recipe", systemImage: "plus")
                        .font(.system(size: 16, weight: .semibold))
                        .padding(.horizontal, 24).padding(.vertical, 12)
                        .background(Color.brandGreen)
                        .foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .padding(.top, 4)
            }
        }
        .padding(.horizontal, 40)
    }

    // MARK: - Grocery CTA

    private var groceryCTA: some View {
        Button { showingGroceryList = true } label: {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(.white.opacity(0.25)).frame(width: 38, height: 38)
                    Image(systemName: "cart.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Get Grocery List")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(.white)
                    Text("\(selectionCount) recipe\(selectionCount == 1 ? "" : "s") · tap to combine ingredients")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.85))
                }

                Spacer()

                Image(systemName: "arrow.right")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
            .background(
                LinearGradient(
                    colors: [Color.brandGreen, Color.brandMid],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: Color.brandGreen.opacity(0.45), radius: 18, x: 0, y: 6)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 20)
    }

    // MARK: - Actions

    private func toggleSelect(_ recipe: Recipe) {
        if selectedRecipes[recipe.id] != nil {
            selectedRecipes.removeValue(forKey: recipe.id)
        } else {
            selectedRecipes[recipe.id] = recipe.servings
        }
    }
}
