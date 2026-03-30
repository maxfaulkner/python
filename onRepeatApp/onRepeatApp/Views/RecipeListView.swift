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

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    LazyVStack(spacing: 10) {
                        if !allTags.isEmpty {
                            tagFilterRow.padding(.top, 4)
                        }

                        if filteredRecipes.isEmpty {
                            emptyState.padding(.top, 60)
                        } else {
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

                        Spacer(minLength: selectedRecipes.isEmpty ? 24 : 110)
                    }
                }
                .searchable(
                    text: $searchText,
                    placement: .navigationBarDrawer(displayMode: .automatic),
                    prompt: "Recipes, ingredients, tags…"
                )

                if !selectedRecipes.isEmpty {
                    generateButton
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle("onRepeat")
            .navigationBarTitleDisplayMode(.large)
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
                if !selectedRecipes.isEmpty {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Clear") {
                            withAnimation(.spring(response: 0.3)) { selectedRecipes.removeAll() }
                        }
                        .font(.system(size: 15))
                        .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationDestination(for: Recipe.self) { RecipeDetailView(recipe: $0) }
            .sheet(isPresented: $showingAddRecipe) { RecipeFormView(mode: .new) }
            .sheet(isPresented: $showingGroceryList) { GroceryListView(selections: grocerySelections) }
            .animation(.spring(response: 0.3), value: selectedRecipes.isEmpty)
        }
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
                .foregroundStyle(active ? .white : Color.secondary)
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
                Text(searchText.isEmpty && activeTagFilter == nil ? "Your recipe book is empty" : "No matches found")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                Text(searchText.isEmpty && activeTagFilter == nil
                     ? "Tap + to add your first recipe."
                     : "Try a different search or filter.")
                    .font(.system(size: 15)).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }
            if searchText.isEmpty && activeTagFilter == nil {
                Button { showingAddRecipe = true } label: {
                    Label("Add Recipe", systemImage: "plus")
                        .font(.system(size: 16, weight: .semibold))
                        .padding(.horizontal, 24).padding(.vertical, 12)
                        .background(Color.brandGreen).foregroundStyle(.white)
                        .clipShape(Capsule())
                }
                .padding(.top, 4)
            }
        }
        .padding(.horizontal, 40)
    }

    // MARK: - Generate Button

    private var generateButton: some View {
        Button { showingGroceryList = true } label: {
            HStack(spacing: 12) {
                ZStack {
                    Circle().fill(.white.opacity(0.2)).frame(width: 34, height: 34)
                    Image(systemName: "cart.fill")
                        .font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("Generate Grocery List")
                        .font(.system(size: 16, weight: .bold))
                    Text("\(selectedRecipes.count) recipe\(selectedRecipes.count == 1 ? "" : "s") selected")
                        .font(.system(size: 12, weight: .medium)).opacity(0.82)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .semibold)).opacity(0.8)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 18).padding(.vertical, 14)
            .background(
                LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                               startPoint: .leading, endPoint: .trailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .shadow(color: Color.brandGreen.opacity(0.42), radius: 16, x: 0, y: 6)
        }
        .padding(.horizontal, 16)
        .padding(.bottom, 14)
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
