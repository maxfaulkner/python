import SwiftUI
import SwiftData

// MARK: - Creator Destination

struct CreatorDestination: Identifiable, Hashable {
    let id: UUID
    let name: String
}

struct CreatorInfo: Identifiable, Hashable {
    let id: UUID
    let name: String
    let cuisine: String
    let recipeCount: Int
}

// MARK: - Sort Order

enum RecipeSortOrder: String, CaseIterable {
    case newest        = "Newest First"
    case alphabetical  = "A to Z"
    case ingredients   = "Most Ingredients"
}

// MARK: - Ownership Filter

private enum OwnershipFilter: String, CaseIterable {
    case all       = "All"
    case mine      = "My Recipes"
    case community = "Community"
}

// MARK: - RecipeListView

struct RecipeListView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(WeeklyPlanStore.self) private var plan
    @Environment(AuthStore.self) private var authStore
    @Query(sort: \Recipe.createdAt, order: .reverse) private var recipes: [Recipe]

    @State private var showingAddRecipe = false
    @State private var activeGroceryList: GroceryList? = nil
    @State private var searchText = ""
    @State private var activeTagFilter: String? = nil
    @State private var sortOrder: RecipeSortOrder = .newest
    @State private var ownershipFilter: OwnershipFilter = .all
    @State private var editingRecipe: Recipe? = nil
    @State private var deletingRecipe: Recipe? = nil
    @State private var detailRecipe: Recipe? = nil
    @State private var selectedCreator: CreatorDestination? = nil

    // MARK: - Computed

    private var allTags: [String] {
        Array(Set(ownershipFiltered.flatMap { $0.tags.map(\.name) })).sorted()
    }

    private var communityRecipes: [Recipe] {
        recipes.filter { $0.creatorID != authStore.currentUserID && $0.isPublic }
    }

    private var creators: [CreatorInfo] {
        let grouped = Dictionary(grouping: communityRecipes, by: { $0.creatorID })
        return grouped.compactMap { (creatorID, recipes) -> CreatorInfo? in
            guard let cid = creatorID, let first = recipes.first else { return nil }
            let allTags = recipes.flatMap { $0.tags.map(\.name) }
            let cuisine = CuisineHelper.cuisine(from: allTags) ?? ""
            return CreatorInfo(id: cid, name: first.creatorName, cuisine: cuisine, recipeCount: recipes.count)
        }.sorted { $0.recipeCount > $1.recipeCount }
    }

    private var cuisineFilters: [String] {
        let allTags = communityRecipes.flatMap { $0.tags.map(\.name) }
        return CuisineHelper.cuisines(from: allTags)
    }

    private var ownershipFiltered: [Recipe] {
        switch ownershipFilter {
        case .all:
            // Own recipes + public recipes from others
            return recipes.filter { $0.creatorID == authStore.currentUserID || $0.isPublic }
        case .mine:
            return recipes.filter { $0.creatorID == authStore.currentUserID }
        case .community:
            return recipes.filter { $0.creatorID != authStore.currentUserID && $0.isPublic }
        }
    }

    private var filteredRecipes: [Recipe] {
        var result = ownershipFiltered
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
            guard let s = plan.selectedRecipes[r.id] else { return nil }
            return (recipe: r, targetServings: s)
        }
    }

    private var selectionCount: Int { plan.selectedRecipes.count }

    private func createAndOpenGroceryList() {
        guard !grocerySelections.isEmpty else { return }
        let names = grocerySelections.map(\.recipe.name)
        let name: String
        if names.count == 1 { name = names[0] }
        else if names.count == 2 { name = "\(names[0]) + \(names[1])" }
        else {
            let fmt = DateFormatter(); fmt.dateFormat = "MMM d"
            name = "\(names.count) Recipes · \(fmt.string(from: Date()))"
        }
        let list = GroceryList.create(name: name, from: grocerySelections, in: modelContext)
        plan.clearAll()
        activeGroceryList = list
    }

    // MARK: - Body

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.appBg.ignoresSafeArea()

            VStack(spacing: 0) {
                if selectionCount > 0 {
                    selectionBanner
                        .transition(.move(edge: .top).combined(with: .opacity))
                }

                ScrollView {
                    LazyVStack(spacing: 10) {
                        ownershipFilterRow.padding(.top, 4)

                        if ownershipFilter == .community && !creators.isEmpty && searchText.isEmpty {
                            creatorsSection
                        }

                        if ownershipFilter == .community && !cuisineFilters.isEmpty {
                            cuisineFilterRow
                        } else if !allTags.isEmpty {
                            tagFilterRow
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
                                    isSelected: plan.isSelected(recipe.id),
                                    targetServings: plan.targetServings(for: recipe.id, defaultServings: recipe.servings),
                                    onToggleSelect: {
                                        withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                                            plan.toggle(recipe)
                                        }
                                    },
                                    onServingsChange: { v in
                                        plan.setServings(v, for: recipe.id)
                                    },
                                    onDetail: {
                                        detailRecipe = recipe
                                    },
                                    currentUserID: authStore.currentUserID,
                                    onCreatorTap: recipe.creatorID != authStore.currentUserID && recipe.creatorID != nil ? {
                                        selectedCreator = CreatorDestination(id: recipe.creatorID!, name: recipe.creatorName)
                                    } : nil
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
        .navigationTitle("All Recipes")
        .navigationBarTitleDisplayMode(.large)
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
        .navigationDestination(item: $detailRecipe) { recipe in RecipeDetailView(recipe: recipe) }
        .navigationDestination(item: $selectedCreator) { creator in
            CreatorRecipesView(creatorID: creator.id, creatorName: creator.name)
        }
        .sheet(isPresented: $showingAddRecipe) { RecipeFormView(mode: .new) }
        .sheet(item: $activeGroceryList) { GroceryListView(groceryList: $0) }
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
            .foregroundStyle(Color.textSecondary)
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(Color.cardSurface)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.06), radius: 4, x: 0, y: 1)
        }
    }

    // MARK: - Context Menu

    @ViewBuilder
    private func contextMenuItems(for recipe: Recipe) -> some View {
        let isSelected = plan.isSelected(recipe.id)
        let isOwn = recipe.creatorID == authStore.currentUserID

        Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                plan.toggle(recipe)
            }
        } label: {
            Label(
                isSelected ? "Remove from List" : "Add to Grocery List",
                systemImage: isSelected ? "cart.badge.minus" : "cart.badge.plus"
            )
        }

        Divider()

        if isOwn {
            Button { editingRecipe = recipe } label: {
                Label("Edit Recipe", systemImage: "pencil")
            }
        }

        Button { duplicateRecipe(recipe) } label: {
            Label("Duplicate", systemImage: "plus.square.on.square")
        }

        if isOwn {
            Divider()

            Button(role: .destructive) {
                deletingRecipe = recipe
            } label: {
                Label("Delete", systemImage: "trash")
            }
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
                .foregroundStyle(Color.textPrimary)
            Spacer()
            Button("Clear all") {
                withAnimation(.spring(response: 0.3)) { plan.clearAll() }
            }
            .font(.system(size: 13))
            .foregroundStyle(Color.textTertiary)
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
                .foregroundStyle(Color.textSecondary)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Ownership Filter

    private var ownershipFilterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(OwnershipFilter.allCases, id: \.self) { filter in
                    Button {
                        withAnimation(.easeInOut(duration: 0.18)) { ownershipFilter = filter }
                    } label: {
                        Text(filter.rawValue)
                            .font(.system(size: 13, weight: ownershipFilter == filter ? .semibold : .regular))
                            .padding(.horizontal, 14).padding(.vertical, 7)
                            .background(ownershipFilter == filter ? Color.brandGreen : Color.cardSurface)
                            .foregroundStyle(ownershipFilter == filter ? .white : Color.textSecondary)
                            .clipShape(Capsule())
                            .shadow(color: ownershipFilter == filter ? Color.brandGreen.opacity(0.3) : Color.black.opacity(0.06),
                                    radius: ownershipFilter == filter ? 6 : 4, x: 0, y: 2)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
        }
    }

    // MARK: - Creators Section

    private var creatorsSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("CREATORS")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.textTertiary)
                .tracking(0.8)
                .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(creators) { creator in
                        Button {
                            selectedCreator = CreatorDestination(id: creator.id, name: creator.name)
                        } label: {
                            creatorCard(creator)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 2)
            }
        }
        .padding(.vertical, 4)
    }

    private func creatorCard(_ creator: CreatorInfo) -> some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(RecipeGradients.linearGradient(for: creator.name))
                    .frame(width: 40, height: 40)
                Text(String(creator.name.prefix(1)))
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(creator.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(1)

                HStack(spacing: 4) {
                    if !creator.cuisine.isEmpty {
                        Text(creator.cuisine)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Color.brandGreen)
                    }
                    Text("·")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.textDisabled)
                    Text("\(creator.recipeCount)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Color.textTertiary)
                    Image(systemName: "book.closed.fill")
                        .font(.system(size: 9))
                        .foregroundStyle(Color.textTertiary)
                }
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.cardSurface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
    }

    // MARK: - Cuisine Filter

    private var cuisineFilterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                tagChip("All", active: activeTagFilter == nil) {
                    withAnimation(.easeInOut(duration: 0.18)) { activeTagFilter = nil }
                }
                ForEach(cuisineFilters, id: \.self) { cuisine in
                    let lowered = cuisine.lowercased()
                    tagChip(cuisine, active: activeTagFilter == lowered) {
                        withAnimation(.easeInOut(duration: 0.18)) {
                            activeTagFilter = activeTagFilter == lowered ? nil : lowered
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 4)
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
                .background(active ? Color.brandGreen : Color.cardSurface)
                .foregroundStyle(active ? .white : Color.textSecondary)
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
                    .foregroundStyle(Color.textPrimary)
                Text(searchText.isEmpty && activeTagFilter == nil
                     ? "Tap + to add your first recipe."
                     : "Try a different search or filter.")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.textTertiary)
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
        Button { createAndOpenGroceryList() } label: {
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

    private func duplicateRecipe(_ recipe: Recipe) {
        let copy = Recipe(name: "\(recipe.name) (Copy)",
                          servings: recipe.servings,
                          instructions: recipe.instructions,
                          isPublic: false,
                          creatorID: authStore.currentUserID,
                          creatorName: authStore.currentDisplayName)
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
        plan.remove(id: recipe.id)
        modelContext.delete(recipe)
        try? modelContext.save()
    }
}
