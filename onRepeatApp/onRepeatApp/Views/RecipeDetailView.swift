import SwiftUI
import SwiftData

struct RecipeDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let recipe: Recipe

    @State private var showingEdit = false
    @State private var showingDeleteAlert = false
    @State private var showingShare = false

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
        .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button { showingShare = true } label: {
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 15, weight: .medium))
                }
                Button("Edit") { showingEdit = true }
                    .font(.system(size: 15, weight: .semibold))
                Button(role: .destructive) { showingDeleteAlert = true } label: {
                    Image(systemName: "trash")
                        .font(.system(size: 15))
                }
            }
        }
        .sheet(isPresented: $showingEdit) { RecipeFormView(mode: .edit(recipe)) }
        .sheet(isPresented: $showingShare) { RecipeShareSheet(recipe: recipe) }
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
            // Gradient fill
            RecipeGradients.linearGradient(for: recipe.name)
                .frame(minHeight: 280)

            // Scrim for text legibility at the bottom
            LinearGradient(
                colors: [.clear, .black.opacity(0.55)],
                startPoint: .top,
                endPoint: .bottom
            )

            // Content overlay
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

                // Meta pills
                HStack(spacing: 8) {
                    metaPill(icon: "person.2.fill", text: "\(recipe.servings.displayString) servings")
                    if !recipe.ingredients.isEmpty {
                        metaPill(icon: "list.bullet", text: "\(recipe.ingredients.count) ingredients")
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
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
        .background(.white.opacity(0.2))
        .clipShape(Capsule())
    }

    // MARK: - Content Stack

    private var contentStack: some View {
        VStack(spacing: 16) {
            // Tags row
            if !recipe.tags.isEmpty {
                tagsRow.padding(.top, 16)
            }

            // Ingredients
            if !recipe.ingredients.isEmpty {
                ingredientsCard
            }

            // Instructions
            if !recipe.instructions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                instructionsCard
            }

            // Share card
            shareCard

            Spacer(minLength: 40)
        }
        .padding(.horizontal, 16)
        .padding(.top, recipe.tags.isEmpty ? 16 : 0)
    }

    private var shareCard: some View {
        Button { showingShare = true } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(RecipeGradients.linearGradient(for: recipe.name))
                        .frame(width: 44, height: 44)
                    Image(systemName: "square.and.arrow.up")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text("Share Recipe")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.primary)
                    Text("Send a link or show a QR code")
                        .font(.system(size: 13))
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.secondary.opacity(0.5))
            }
            .padding(14)
            .cardSurface()
        }
        .buttonStyle(.plain)
    }

    // MARK: - Tags

    private var tagsRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(recipe.tags.sorted { $0.name < $1.name }) { tag in
                    Text(tag.name)
                        .font(.system(size: 13, weight: .semibold))
                        .padding(.horizontal, 12).padding(.vertical, 6)
                        .background(Color.brandGreen.opacity(0.1))
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
                        .foregroundStyle(.secondary)
                        .frame(width: ing.unit.isEmpty ? 10 : 54, alignment: .leading)

                    Text(ing.name)
                        .font(.system(size: 15))

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
            Spacer()
            if let badge {
                Text(badge)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
        .padding(.bottom, 10)
    }
}
