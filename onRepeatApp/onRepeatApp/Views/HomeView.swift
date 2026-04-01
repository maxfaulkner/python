import SwiftUI
import SwiftData

// MARK: - Meal Type Filter

private enum MealType: String, CaseIterable {
    case all       = "All"
    case breakfast = "Breakfast"
    case lunch     = "Lunch"
    case dinner    = "Dinner"
}

// MARK: - HomeView

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(WeeklyPlanStore.self) private var plan
    @Query(sort: \Recipe.createdAt, order: .reverse) private var recipes: [Recipe]
    @Query(sort: \GroceryList.createdAt, order: .reverse) private var groceryLists: [GroceryList]

    @State private var showingAddRecipe = false
    @State private var showingAllRecipes = false
    @State private var activeGroceryList: GroceryList? = nil
    @State private var mealFilter: MealType = .all
    @State private var deletingList: GroceryList? = nil

    // MARK: - Computed

    private var activeLists: [GroceryList] { groceryLists.filter { !$0.isCompleted } }
    private var completedLists: [GroceryList] { groceryLists.filter { $0.isCompleted } }

    private var grocerySelections: [(recipe: Recipe, targetServings: Double)] {
        recipes.compactMap { r in
            guard let s = plan.selectedRecipes[r.id] else { return nil }
            return (recipe: r, targetServings: s)
        }
    }

    private var selectionCount: Int { plan.selectedRecipes.count }

    private var filteredPickerRecipes: [Recipe] {
        guard mealFilter != .all else { return recipes }
        let keyword = mealFilter.rawValue.lowercased()
        return recipes.filter { r in
            r.tags.contains { $0.name.localizedCaseInsensitiveContains(keyword) }
        }
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        if !activeLists.isEmpty || !completedLists.isEmpty {
                            yourListsSection
                        }

                        buildListSection

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 4)
                }
            }
            .navigationTitle("onRepeat")
            .navigationBarTitleDisplayMode(.large)
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
            .onAppear {
                SeedData.seedIfNeeded(context: modelContext)
                plan.load(validIDs: Set(recipes.map(\.id)))
            }
            .navigationDestination(for: Recipe.self) { RecipeDetailView(recipe: $0) }
            .navigationDestination(isPresented: $showingAllRecipes) { RecipeListView() }
            .sheet(isPresented: $showingAddRecipe) { RecipeFormView(mode: .new) }
            .sheet(item: $activeGroceryList) { list in
                GroceryListView(groceryList: list)
            }
            .alert("Delete List?", isPresented: Binding(
                get: { deletingList != nil },
                set: { if !$0 { deletingList = nil } }
            )) {
                Button("Delete", role: .destructive) {
                    if let l = deletingList {
                        modelContext.delete(l)
                        try? modelContext.save()
                    }
                    deletingList = nil
                }
                Button("Cancel", role: .cancel) { deletingList = nil }
            } message: {
                if let l = deletingList { Text("\"\(l.name)\" will be permanently deleted.") }
            }
        }
    }

    // MARK: - Your Lists Section

    private var yourListsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("YOUR LISTS")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.textTertiary)
                .tracking(0.8)

            VStack(spacing: 10) {
                ForEach(activeLists) { list in
                    groceryListCard(list, completed: false)
                }

                if !completedLists.isEmpty {
                    if !activeLists.isEmpty {
                        HStack {
                            Text("COMPLETED")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(Color.textDisabled)
                                .tracking(0.6)
                            Spacer()
                        }
                        .padding(.top, 4)
                    }
                    ForEach(completedLists.prefix(3)) { list in
                        groceryListCard(list, completed: true)
                    }
                }
            }
        }
    }

    private func groceryListCard(_ list: GroceryList, completed: Bool) -> some View {
        Button {
            activeGroceryList = list
        } label: {
            HStack(spacing: 14) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(completed
                              ? Color.textDisabled.opacity(0.15)
                              : Color.brandGreen.opacity(0.12))
                        .frame(width: 44, height: 44)
                    Image(systemName: completed ? "checkmark.circle.fill" : "cart.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(completed ? Color.textDisabled : Color.brandGreen)
                }

                // Text
                VStack(alignment: .leading, spacing: 3) {
                    Text(list.name)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(completed ? Color.textTertiary : Color.textPrimary)

                    Text(list.recipeNames.prefix(3).joined(separator: " · "))
                        .font(.system(size: 12))
                        .foregroundStyle(Color.textTertiary)
                        .lineLimit(1)
                }

                Spacer()

                // Progress ring or chevron
                if !completed {
                    ZStack {
                        Circle()
                            .stroke(Color.borderColor.opacity(0.5), lineWidth: 3)
                            .frame(width: 32, height: 32)
                        Circle()
                            .trim(from: 0, to: list.progress)
                            .stroke(Color.brandGreen, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                            .frame(width: 32, height: 32)
                        Text("\(list.snapshotItemCount - list.checkedCount)")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(Color.textSecondary)
                    }
                } else {
                    Text(list.createdAt.shortDateString)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.textDisabled)
                }
            }
            .padding(14)
            .background(Color.cardSurface)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .shadow(color: .black.opacity(0.05), radius: 6, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button(role: .destructive) { deletingList = list } label: {
                Label("Delete List", systemImage: "trash")
            }
        }
    }

    // MARK: - Build List Section

    private var buildListSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section header
            HStack {
                Text("BUILD A LIST")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(Color.textTertiary)
                    .tracking(0.8)
                Spacer()
                Button { showingAllRecipes = true } label: {
                    HStack(spacing: 4) {
                        Text("See all \(recipes.count)")
                            .font(.system(size: 13, weight: .semibold))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundStyle(Color.brandGreen)
                }
            }

            // Meal type filter
            if hasMealTypeTags {
                mealTypeFilter
            }

            // Recipe picker cards
            if recipes.isEmpty {
                Button { showingAddRecipe = true } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "plus.circle.fill").font(.system(size: 20))
                        Text("Add your first recipe").font(.system(size: 15, weight: .medium))
                    }
                    .foregroundStyle(Color.brandGreen)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .cardSurface()
                }
                .buttonStyle(.plain)
            } else if filteredPickerRecipes.isEmpty {
                VStack(spacing: 6) {
                    Text("No \(mealFilter.rawValue.lowercased()) recipes yet")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.textTertiary)
                    Text("Add the \"\(mealFilter.rawValue.lowercased())\" tag to a recipe.")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.textDisabled)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 24)
                .cardSurface()
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(filteredPickerRecipes) { recipe in
                            RecipePickCard(
                                recipe: recipe,
                                isSelected: plan.isSelected(recipe.id),
                                onToggle: {
                                    withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                                        plan.toggle(recipe)
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 2).padding(.vertical, 2)
                }
            }

            // Selected recipes strip + Create button
            if selectionCount > 0 {
                selectedStrip
                createListButton
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: selectionCount)
    }

    // MARK: - Meal Type Filter

    private var hasMealTypeTags: Bool {
        let allTagNames = Set(recipes.flatMap { $0.tags.map { $0.name.lowercased() } })
        return MealType.allCases.dropFirst().contains { allTagNames.contains($0.rawValue.lowercased()) }
    }

    private var mealTypeFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(MealType.allCases, id: \.self) { type in
                    Button {
                        withAnimation(.easeInOut(duration: 0.18)) { mealFilter = type }
                    } label: {
                        Text(type.rawValue)
                            .font(.system(size: 13, weight: mealFilter == type ? .semibold : .regular))
                            .padding(.horizontal, 14).padding(.vertical, 7)
                            .background(mealFilter == type ? Color.brandGreen : Color.cardSurface)
                            .foregroundStyle(mealFilter == type ? .white : Color.textSecondary)
                            .clipShape(Capsule())
                            .shadow(
                                color: mealFilter == type
                                    ? Color.brandGreen.opacity(0.3)
                                    : Color.black.opacity(0.06),
                                radius: mealFilter == type ? 6 : 4, x: 0, y: 2
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2).padding(.vertical, 2)
        }
    }

    // MARK: - Selected Strip

    private var selectedStrip: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("\(selectionCount) recipe\(selectionCount == 1 ? "" : "s") selected")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.textSecondary)
                Spacer()
                Button("Clear all") {
                    withAnimation { plan.clearAll() }
                }
                .font(.system(size: 13))
                .foregroundStyle(Color.textTertiary)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(grocerySelections, id: \.recipe.id) { sel in
                        weekRecipeChip(sel.recipe)
                    }
                }
                .padding(.vertical, 2)
            }
        }
        .padding(14)
        .background(Color.brandGreen.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func weekRecipeChip(_ recipe: Recipe) -> some View {
        Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                plan.toggle(recipe)
            }
        } label: {
            HStack(spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 5)
                        .fill(RecipeGradients.linearGradient(for: recipe.name))
                        .frame(width: 22, height: 22)
                    Text(RecipeEmojiMapper.emoji(
                        name: recipe.name.lowercased(),
                        tags: recipe.tags.map { $0.name.lowercased() }
                    ))
                    .font(.system(size: 11))
                }
                Text(recipe.name)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(1)
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(Color.textTertiary)
            }
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(Color.cardSurface)
            .clipShape(Capsule())
            .shadow(color: .black.opacity(0.05), radius: 3, x: 0, y: 1)
        }
        .buttonStyle(.plain)
    }

    // MARK: - Create List Button

    private var createListButton: some View {
        Button {
            createList()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "cart.badge.plus")
                    .font(.system(size: 15, weight: .semibold))
                Text("Create Grocery List")
                    .font(.system(size: 17, weight: .bold))
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 14, weight: .bold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 18).padding(.vertical, 16)
            .background(
                LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                               startPoint: .leading, endPoint: .trailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color.brandGreen.opacity(0.35), radius: 10, x: 0, y: 4)
        }
    }

    // MARK: - Actions

    private func createList() {
        guard !grocerySelections.isEmpty else { return }

        // Auto-name: recipe names if 1-2, else "N Recipes · Date"
        let name: String
        if grocerySelections.count == 1 {
            name = grocerySelections[0].recipe.name
        } else if grocerySelections.count == 2 {
            name = "\(grocerySelections[0].recipe.name) + \(grocerySelections[1].recipe.name)"
        } else {
            let fmt = DateFormatter()
            fmt.dateFormat = "MMM d"
            name = "\(grocerySelections.count) Recipes · \(fmt.string(from: Date()))"
        }

        let list = GroceryList.create(name: name, from: grocerySelections, in: modelContext)

        // Clear the builder selection — the list now owns these recipes
        plan.clearAll()

        // Open the freshly created list
        activeGroceryList = list
    }
}

// MARK: - Recipe Pick Card

struct RecipePickCard: View {
    let recipe: Recipe
    let isSelected: Bool
    let onToggle: () -> Void

    private var emoji: String {
        RecipeEmojiMapper.emoji(
            name: recipe.name.lowercased(),
            tags: recipe.tags.map { $0.name.lowercased() }
        )
    }

    var body: some View {
        Button(action: onToggle) {
            ZStack(alignment: .topTrailing) {
                ZStack(alignment: .bottomLeading) {
                    RecipeGradients.linearGradient(for: recipe.name)

                    LinearGradient(
                        colors: [.clear, .black.opacity(0.55)],
                        startPoint: UnitPoint(x: 0.5, y: 0.35),
                        endPoint: .bottom
                    )

                    VStack(alignment: .leading, spacing: 3) {
                        Text(emoji).font(.system(size: 30))
                        Text(recipe.name)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(10)
                }

                // Selection badge
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.white : Color.black.opacity(0.3))
                        .frame(width: 24, height: 24)
                    if isSelected {
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .black))
                            .foregroundStyle(Color.brandGreen)
                    }
                }
                .padding(8)
                .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isSelected)
            }
        }
        .frame(width: 130, height: 155)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(isSelected ? Color.white.opacity(0.6) : Color.clear, lineWidth: 2)
        )
        .shadow(
            color: isSelected ? Color.brandGreen.opacity(0.3) : Color.black.opacity(0.12),
            radius: isSelected ? 10 : 6, x: 0, y: 3
        )
        .animation(.spring(response: 0.3, dampingFraction: 0.75), value: isSelected)
        .buttonStyle(.plain)
    }
}

// MARK: - Date Helper

private extension Date {
    var shortDateString: String {
        let cal = Calendar.current
        if cal.isDateInToday(self) { return "Today" }
        if cal.isDateInYesterday(self) { return "Yesterday" }
        let fmt = DateFormatter()
        fmt.dateStyle = .short
        fmt.timeStyle = .none
        return fmt.string(from: self)
    }
}
