import SwiftUI
import SwiftData

// MARK: - Sort Order

enum RecipeSortOrder: String, CaseIterable {
    case newest        = "Newest First"
    case alphabetical  = "A to Z"
    case ingredients   = "Most Ingredients"
}

// MARK: - RecipeListView

struct RecipeListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Recipe.createdAt, order: .reverse) private var recipes: [Recipe]

    @State private var selectedRecipes: [UUID: Double] = [:]
    @State private var showingAddRecipe = false
    @State private var showingGroceryList = false
    @State private var searchText = ""
    @State private var activeTagFilter: String? = nil
    @State private var sortOrder: RecipeSortOrder = .newest
    @State private var editingRecipe: Recipe? = nil
    @State private var deletingRecipe: Recipe? = nil

    private let selectionStoreKey = "weeklySelection"

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
        switch sortOrder {
        case .newest:       break  // already sorted by @Query
        case .alphabetical: result.sort { $0.name.localizedCompare($1.name) == .orderedAscending }
        case .ingredients:  result.sort { $0.ingredients.count > $1.ingredients.count }
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
                                if selectionCount == 0 && searchText.isEmpty && activeTagFilter == nil {
                                    hintBanner
                                }
                                ForEach(filteredRecipes) { recipe in
                                    RecipeCardView(
                                        recipe: recipe,
                                        isSelected: selectedRecipes[recipe.id] != nil,
                                        targetServings: selectedRecipes[recipe.id] ?? recipe.servings,
                                        onToggleSelect: { toggleSelect(recipe) },
                                        onServingsChange: { v in
                                            selectedRecipes[recipe.id] = v
                                            saveSelection()
                                        }
                                    )
                                    .padding(.horizontal, 16)
                                    .contextMenu {
                                        contextMenuItems(for: recipe)
                                    }
                                }
                            }

                            Spacer(minLength: selectionCount > 0 ? 120 : 24)
                        }
                    }
                    .searchable(
                        text: $searchText,
                        placement: .navigationBarDrawer(displayMode: .automatic),
                        prompt: "Search recipes, ingredients, tags…"
                    )
                }

                if selectionCount > 0 {
                    groceryCTA
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .navigationTitle("onRepeat")
            .navigationBarTitleDisplayMode(.large)
            .toolbarColorScheme(.light, for: .navigationBar)
            .onAppear {
                SeedData.seedIfNeeded(context: modelContext)
                loadSelection()
            }
            .onChange(of: selectedRecipes) { saveSelection() }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    sortMenu
                }
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
            .sheet(item: $editingRecipe) { RecipeFormView(mode: .edit($0)) }
            .alert("Delete Recipe?", isPresented: Binding(
                get: { deletingRecipe != nil },
                set: { if !$0 { deletingRecipe = nil } }
            )) {
                Button("Delete", role: .destructive) {
                    if let r = deletingRecipe { deleteRecipe(r) }
                }
                Button("Cancel", role: .cancel) { deletingRecipe = nil }
            } message: {
                if let r = deletingRecipe {
                    Text("\"\(r.name)\" will be permanently deleted.")
                }
            }
            .animation(.spring(response: 0.3), value: selectionCount)
        }
    }

    // MARK: - Sort Menu

    private var sortMenu: some View {
        Menu {
            ForEach(RecipeSortOrder.allCases, id: \.self) { order in
                Button {
                    withAnimation { sortOrder = order }
                } label: {
                    HStack {
                        Text(order.rawValue)
                        if sortOrder == order {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "arrow.up.arrow.down")
                    .font(.system(size: 13, weight: .semibold))
                Text(sortOrder.rawValue)
                    .font(.system(size: 13, weight: .medium))
            }
            .foregroundStyle(Color(hex: "555555"))
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(Color.white)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
        }
    }

    // MARK: - Context Menu

    @ViewBuilder
    private func contextMenuItems(for recipe: Recipe) -> some View {
        let isSelected = selectedRecipes[recipe.id] != nil

        Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                toggleSelect(recipe)
            }
        } label: {
            Label(
                isSelected ? "Remove from List" : "Add to Grocery List",
                systemImage: isSelected ? "cart.badge.minus" : "cart.badge.plus"
            )
        }

        Divider()

        Button { editingRecipe = recipe } label: {
            Label("Edit Recipe", systemImage: "pencil")
        }

        Button { duplicateRecipe(recipe) } label: {
            Label("Duplicate", systemImage: "plus.square.on.square")
        }

        Divider()

        Button(role: .destructive) {
            deletingRecipe = recipe
        } label: {
            Label("Delete", systemImage: "trash")
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
            Text("Tap a recipe to add it to your grocery list")
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
                    Circle().fill(.white.opacity(0.25)).frame(width: 40, height: 40)
                    Image(systemName: "cart.fill")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Get Grocery List")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(.white)
                    Text("\(selectionCount) recipe\(selectionCount == 1 ? "" : "s") selected")
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
                LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                               startPoint: .leading, endPoint: .trailing)
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

    private func duplicateRecipe(_ recipe: Recipe) {
        let copy = Recipe(name: "\(recipe.name) (Copy)",
                          servings: recipe.servings,
                          instructions: recipe.instructions)
        modelContext.insert(copy)
        for tag in recipe.tags { copy.tags.append(tag) }
        for ing in recipe.ingredients {
            let newIng = Ingredient(quantity: ing.quantity, unit: ing.unit, name: ing.name)
            modelContext.insert(newIng)
            copy.ingredients.append(newIng)
        }
        try? modelContext.save()
    }

    private func deleteRecipe(_ recipe: Recipe) {
        selectedRecipes.removeValue(forKey: recipe.id)
        modelContext.delete(recipe)
        try? modelContext.save()
        saveSelection()
    }

    // MARK: - Persist Selection

    private func saveSelection() {
        let dict = selectedRecipes.reduce(into: [String: Double]()) {
            $0[$1.key.uuidString] = $1.value
        }
        if let data = try? JSONEncoder().encode(dict) {
            UserDefaults.standard.set(data, forKey: selectionStoreKey)
        }
    }

    private func loadSelection() {
        guard let data = UserDefaults.standard.data(forKey: selectionStoreKey),
              let dict = try? JSONDecoder().decode([String: Double].self, from: data)
        else { return }
        let validIDs = Set(recipes.map(\.id))
        selectedRecipes = dict.reduce(into: [:]) { result, pair in
            if let uuid = UUID(uuidString: pair.key), validIDs.contains(uuid) {
                result[uuid] = pair.value
            }
        }
    }
}
