import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(WeeklyPlanStore.self) private var plan
    @Query(sort: \Recipe.createdAt, order: .reverse) private var recipes: [Recipe]

    @State private var showingAddRecipe = false
    @State private var showingGroceryList = false
    @State private var showingAllRecipes = false

    // MARK: - Computed

    private var grocerySelections: [(recipe: Recipe, targetServings: Double)] {
        recipes.compactMap { r in
            guard let s = plan.selectedRecipes[r.id] else { return nil }
            return (recipe: r, targetServings: s)
        }
    }

    private var selectionCount: Int { plan.selectedRecipes.count }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        thisWeekSection
                        quickPickSection
                        if !plan.pastRuns.isEmpty {
                            pastRunsSection
                        }
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
            .sheet(isPresented: $showingGroceryList) {
                GroceryListView(selections: grocerySelections)
            }
        }
    }

    // MARK: - This Week

    private var thisWeekSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            if selectionCount == 0 {
                emptyWeekCard
            } else {
                filledWeekCard
            }
        }
    }

    private var emptyWeekCard: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("🛒")
                    .font(.system(size: 48))
                Text("Plan your week")
                    .font(.system(size: 22, weight: .black, design: .rounded))
                    .foregroundStyle(Color.textPrimary)
                Text("Pick recipes below to build\nyour grocery list in seconds.")
                    .font(.system(size: 15))
                    .foregroundStyle(Color.textSecondary)
                    .multilineTextAlignment(.center)
            }

            Button { showingAllRecipes = true } label: {
                HStack(spacing: 8) {
                    Image(systemName: "fork.knife")
                        .font(.system(size: 14, weight: .semibold))
                    Text("Browse Recipes")
                        .font(.system(size: 15, weight: .semibold))
                }
                .foregroundStyle(Color.brandGreen)
                .padding(.horizontal, 20).padding(.vertical, 11)
                .background(Color.brandGreen.opacity(0.1))
                .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
        .cardSurface()
    }

    private var filledWeekCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header row
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("THIS WEEK")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color.brandGreen)
                        .tracking(1)
                    Text("\(selectionCount) recipe\(selectionCount == 1 ? "" : "s") planned")
                        .font(.system(size: 18, weight: .black, design: .rounded))
                        .foregroundStyle(Color.textPrimary)
                }
                Spacer()
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        plan.clearAll()
                    }
                } label: {
                    Text("Clear")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.textTertiary)
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)

            // Recipe chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(grocerySelections, id: \.recipe.id) { sel in
                        weekRecipeChip(sel.recipe)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 4)
            }

            Divider()
                .padding(.vertical, 12)
                .padding(.horizontal, 16)

            // Grocery CTA
            Button {
                recordAndOpenGroceryList()
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "cart.fill")
                        .font(.system(size: 15, weight: .semibold))
                    Text("Get Grocery List")
                        .font(.system(size: 17, weight: .bold))
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 14, weight: .bold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 15)
                .background(
                    LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: Color.brandGreen.opacity(0.3), radius: 8, x: 0, y: 3)
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .cardSurface()
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: selectionCount)
    }

    private func weekRecipeChip(_ recipe: Recipe) -> some View {
        Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                plan.toggle(recipe)
            }
        } label: {
            HStack(spacing: 7) {
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(RecipeGradients.linearGradient(for: recipe.name))
                        .frame(width: 26, height: 26)
                    Text(RecipeEmojiMapper.emoji(
                        name: recipe.name.lowercased(),
                        tags: recipe.tags.map { $0.name.lowercased() }
                    ))
                    .font(.system(size: 13))
                }
                Text(recipe.name)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(1)
                Image(systemName: "xmark")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(Color.textTertiary)
            }
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(Color.surfaceSecondary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Quick Pick

    private var quickPickSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Section header
            HStack {
                Text("RECIPES")
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

            if recipes.isEmpty {
                // Empty library state
                Button { showingAddRecipe = true } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                        Text("Add your first recipe")
                            .font(.system(size: 15, weight: .medium))
                    }
                    .foregroundStyle(Color.brandGreen)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
                    .cardSurface()
                }
                .buttonStyle(.plain)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(recipes) { recipe in
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
                    .padding(.horizontal, 2)
                    .padding(.vertical, 2)
                }
            }
        }
    }

    // MARK: - Past Runs

    private var pastRunsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PAST RUNS")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color.textTertiary)
                .tracking(0.8)

            VStack(spacing: 0) {
                ForEach(Array(plan.pastRuns.prefix(5).enumerated()), id: \.element.id) { idx, run in
                    pastRunRow(run)
                    if idx < min(plan.pastRuns.count, 5) - 1 {
                        Divider().padding(.leading, 16)
                    }
                }
            }
            .cardSurface()
        }
    }

    private func pastRunRow(_ run: PastRun) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(Color.brandGreen.opacity(0.1))
                    .frame(width: 36, height: 36)
                Image(systemName: "cart.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.brandGreen)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(run.recipeNames.prefix(3).joined(separator: ", "))
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(1)
                Text("\(run.recipeNames.count) recipe\(run.recipeNames.count == 1 ? "" : "s") · \(run.itemCount) items · \(run.date.relativeString)")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.textTertiary)
            }

            Spacer()

            // Re-apply this run
            Button {
                reapplyRun(run)
            } label: {
                Image(systemName: "arrow.counterclockwise")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.textDisabled)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
    }

    // MARK: - Actions

    private func recordAndOpenGroceryList() {
        let itemCount = IngredientCombiner.combine(grocerySelections).count
        plan.recordRun(
            recipeNames: grocerySelections.map(\.recipe.name),
            itemCount: itemCount
        )
        showingGroceryList = true
    }

    private func reapplyRun(_ run: PastRun) {
        // Find recipes by name and select them
        let nameSet = Set(run.recipeNames)
        let matching = recipes.filter { nameSet.contains($0.name) }
        guard !matching.isEmpty else { return }
        withAnimation(.spring(response: 0.3)) {
            plan.clearAll()
            for recipe in matching {
                plan.toggle(recipe)
            }
        }
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
                    // Gradient background
                    RecipeGradients.linearGradient(for: recipe.name)

                    // Scrim for legibility
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.55)],
                        startPoint: UnitPoint(x: 0.5, y: 0.35),
                        endPoint: .bottom
                    )

                    // Emoji + name
                    VStack(alignment: .leading, spacing: 3) {
                        Text(emoji)
                            .font(.system(size: 30))
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
    var relativeString: String {
        let cal = Calendar.current
        if cal.isDateInToday(self) { return "Today" }
        if cal.isDateInYesterday(self) { return "Yesterday" }
        let diff = cal.dateComponents([.day], from: self, to: Date()).day ?? 0
        if diff < 7 {
            let fmt = DateFormatter()
            fmt.dateFormat = "EEEE"
            return fmt.string(from: self)
        }
        let fmt = DateFormatter()
        fmt.dateStyle = .medium
        fmt.timeStyle = .none
        return fmt.string(from: self)
    }
}
