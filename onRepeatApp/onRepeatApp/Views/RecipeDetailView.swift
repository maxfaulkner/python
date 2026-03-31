import SwiftUI
import SwiftData

struct RecipeDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let recipe: Recipe

    @State private var showingEdit = false
    @State private var showingDeleteAlert = false
    @State private var showingShare = false
    @State private var showingCookMode = false

    // MARK: - Body

    var body: some View {
        ZStack(alignment: .top) {
            Color.appBg.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    heroHeader
                    contentStack
                }
            }
            .ignoresSafeArea(edges: .top)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbarBackground(.clear, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button { showingEdit = true } label: {
                        Label("Edit Recipe", systemImage: "pencil")
                    }
                    Button { duplicateRecipe() } label: {
                        Label("Duplicate", systemImage: "plus.square.on.square")
                    }
                    Button { showingShare = true } label: {
                        Label("Share Recipe", systemImage: "square.and.arrow.up")
                    }
                    Divider()
                    Button(role: .destructive) { showingDeleteAlert = true } label: {
                        Label("Delete Recipe", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
                }
            }
        }
        .sheet(isPresented: $showingEdit) { RecipeFormView(mode: .edit(recipe)) }
        .sheet(isPresented: $showingShare) { RecipeShareSheet(recipe: recipe) }
        .fullScreenCover(isPresented: $showingCookMode) { CookModeView(recipe: recipe) }
        .alert("Delete Recipe?", isPresented: $showingDeleteAlert) {
            Button("Delete", role: .destructive) {
                modelContext.delete(recipe)
                try? modelContext.save()
                dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\"\(recipe.name)\" will be permanently deleted.")
        }
    }

    // MARK: - Hero Header

    private var heroHeader: some View {
        ZStack(alignment: .bottom) {
            RecipeGradients.linearGradient(for: recipe.name)
                .frame(minHeight: 300)

            LinearGradient(
                colors: [.clear, .black.opacity(0.6)],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 10) {
                Text(RecipeEmojiMapper.emoji(
                    name: recipe.name.lowercased(),
                    tags: recipe.tags.map { $0.name.lowercased() }
                ))
                .font(.system(size: 60))

                Text(recipe.name)
                    .font(.system(size: 30, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 8) {
                    metaPill(icon: "person.2.fill", text: "\(recipe.servings.displayString) servings")
                    if !recipe.ingredients.isEmpty {
                        metaPill(icon: "list.bullet", text: "\(recipe.ingredients.count) ingredients")
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func metaPill(icon: String, text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 11, weight: .semibold))
            Text(text).font(.system(size: 13, weight: .semibold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(.white.opacity(0.25))
        .clipShape(Capsule())
    }

    // MARK: - Content Stack

    private var contentStack: some View {
        VStack(spacing: 16) {
            if !recipe.tags.isEmpty {
                tagsRow.padding(.top, 16)
            }

            if !recipe.ingredients.isEmpty {
                ingredientsCard
            }

            if !recipe.instructions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                instructionsCard

                // Cook mode CTA — only shown when there are instructions
                cookButton
            }

            Spacer(minLength: 40)
        }
        .padding(.horizontal, 16)
        .padding(.top, recipe.tags.isEmpty ? 16 : 0)
    }

    // MARK: - Cook Button

    private var cookButton: some View {
        Button { showingCookMode = true } label: {
            HStack(spacing: 10) {
                Image(systemName: "flame.fill")
                    .font(.system(size: 15, weight: .semibold))
                Text("Start Cooking")
                    .font(.system(size: 16, weight: .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                               startPoint: .leading, endPoint: .trailing)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .shadow(color: Color.brandGreen.opacity(0.35), radius: 10, x: 0, y: 4)
        }
    }

    // MARK: - Tags

    private var tagsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(recipe.tags.sorted { $0.name < $1.name }) { tag in
                    Text(tag.name)
                        .font(.system(size: 13, weight: .semibold))
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(Color.brandGreen.opacity(0.12))
                        .foregroundStyle(Color.brandGreen)
                        .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Ingredients Card

    private var ingredientsCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            sectionHeader(title: "Ingredients", icon: "list.bullet",
                          badge: "\(recipe.ingredients.count)")

            let sorted = recipe.ingredients.sorted { $0.name < $1.name }
            ForEach(Array(sorted.enumerated()), id: \.element.id) { idx, ing in
                HStack(spacing: 0) {
                    Text(ing.quantity.displayString)
                        .font(.system(size: 15, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(Color.brandGreen)
                        .frame(width: 44, alignment: .trailing)

                    Text(ing.unit.isEmpty ? "" : " \(ing.unit)")
                        .font(.system(size: 15))
                        .foregroundStyle(Color(hex: "888888"))
                        .frame(width: ing.unit.isEmpty ? 10 : 54, alignment: .leading)

                    Text(ing.name)
                        .font(.system(size: 15))
                        .foregroundStyle(Color(hex: "1A1A1A"))

                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 11)

                if idx < sorted.count - 1 {
                    Divider().padding(.leading, 16)
                }
            }
            Spacer().frame(height: 8)
        }
        .cardSurface()
    }

    // MARK: - Instructions Card

    private var instructionsCard: some View {
        let steps = recipe.instructions
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        return VStack(alignment: .leading, spacing: 0) {
            sectionHeader(title: "Instructions", icon: "text.alignleft",
                          badge: steps.count > 1 ? "\(steps.count) steps" : nil)

            if steps.count > 1 {
                ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                    HStack(alignment: .top, spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(RecipeGradients.linearGradient(for: recipe.name))
                                .frame(width: 28, height: 28)
                            Text("\(idx + 1)")
                                .font(.system(size: 12, weight: .black))
                                .foregroundStyle(.white)
                        }
                        .padding(.top, 1)

                        Text(step)
                            .font(.system(size: 15))
                            .foregroundStyle(Color(hex: "1A1A1A"))
                            .lineSpacing(3)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)

                    if idx < steps.count - 1 {
                        Divider().padding(.leading, 58)
                    }
                }
            } else {
                Text(recipe.instructions)
                    .font(.system(size: 15))
                    .foregroundStyle(Color(hex: "1A1A1A"))
                    .lineSpacing(4)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
            }
            Spacer().frame(height: 8)
        }
        .cardSurface()
    }

    // MARK: - Section Header

    private func sectionHeader(title: String, icon: String, badge: String?) -> some View {
        HStack {
            Label(title, systemImage: icon)
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(Color(hex: "1A1A1A"))
            Spacer()
            if let badge {
                Text(badge)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(Color(hex: "888888"))
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 10)
    }

    // MARK: - Duplicate

    private func duplicateRecipe() {
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
        dismiss()
    }
}
