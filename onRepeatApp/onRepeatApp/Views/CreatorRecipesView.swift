import SwiftUI
import SwiftData

struct CreatorRecipesView: View {
    let creatorID: UUID
    let creatorName: String

    @Query(sort: \Recipe.createdAt, order: .reverse) private var allRecipes: [Recipe]
    @Environment(WeeklyPlanStore.self) private var plan

    @State private var searchText = ""
    @State private var activeTagFilter: String? = nil
    @State private var detailRecipe: Recipe? = nil

    // MARK: - Computed

    private var creatorRecipes: [Recipe] {
        allRecipes.filter { $0.creatorID == creatorID && $0.isPublic }
    }

    private var allTags: [String] {
        Array(Set(creatorRecipes.flatMap { $0.tags.map(\.name) })).sorted()
    }

    private var filteredRecipes: [Recipe] {
        var result = creatorRecipes
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

    private var selectionCount: Int { plan.selectedRecipes.count }

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
                        creatorHeader.padding(.top, 8)

                        if !allTags.isEmpty {
                            tagFilterRow
                        }

                        if filteredRecipes.isEmpty {
                            emptyState.padding(.top, 40)
                        } else {
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
                                    onDetail: { detailRecipe = recipe }
                                )
                                .padding(.horizontal, 16)
                            }
                        }

                        Spacer(minLength: selectionCount > 0 ? 120 : 24)
                    }
                }
                .searchable(
                    text: $searchText,
                    placement: .navigationBarDrawer(displayMode: .automatic),
                    prompt: "Search \(creatorName)'s recipes..."
                )
            }

            if selectionCount > 0 {
                selectionCTA
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .navigationTitle(creatorName)
        .navigationBarTitleDisplayMode(.large)
        .navigationDestination(item: $detailRecipe) { recipe in
            RecipeDetailView(recipe: recipe)
        }
        .animation(.spring(response: 0.3), value: selectionCount)
    }

    // MARK: - Derived Stats

    private var cuisineSpecialty: String? {
        let allTagNames = creatorRecipes.flatMap { $0.tags.map(\.name) }
        return CuisineHelper.cuisine(from: allTagNames)
    }

    private var avgIngredients: Int {
        guard !creatorRecipes.isEmpty else { return 0 }
        let total = creatorRecipes.reduce(0) { $0 + $1.ingredients.count }
        return total / creatorRecipes.count
    }

    // MARK: - Creator Header

    private var creatorHeader: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.brandGreen)
                    .frame(width: 52, height: 52)
                Text(String(creatorName.prefix(1)))
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(creatorName)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Color.textPrimary)

                if let cuisine = cuisineSpecialty {
                    Text(cuisine)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.brandGreen)
                }

                Text("\(creatorRecipes.count) recipes · \(avgIngredients) ingredients avg")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.textTertiary)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
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

    // MARK: - Selection CTA

    private var selectionCTA: some View {
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(.white.opacity(0.25)).frame(width: 40, height: 40)
                Image(systemName: "cart.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("\(selectionCount) recipe\(selectionCount == 1 ? "" : "s") added to list")
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.white)
                Text("Go back to generate your grocery list")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.85))
            }
            Spacer()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 16)
        .background(
            LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                           startPoint: .leading, endPoint: .trailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: Color.brandGreen.opacity(0.45), radius: 18, x: 0, y: 6)
        .padding(.horizontal, 16)
        .padding(.bottom, 20)
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("No matches found")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Color.textPrimary)
            Text("Try a different search or filter.")
                .font(.system(size: 14))
                .foregroundStyle(Color.textTertiary)
        }
    }
}
