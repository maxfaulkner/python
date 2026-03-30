import SwiftUI
import SwiftData

struct ImportPreviewView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let payload: SharedRecipePayload

    @State private var didImport = false
    @State private var alreadyExists = false

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 0) {
                        heroHeader
                        contentArea
                    }
                }
                .ignoresSafeArea(edges: .top)

                // Floating bottom bar
                VStack {
                    Spacer()
                    bottomBar
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbarBackground(.clear, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 30, height: 30)
                            .background(.black.opacity(0.25))
                            .clipShape(Circle())
                    }
                }
            }
        }
    }

    // MARK: - Hero

    private var heroHeader: some View {
        ZStack(alignment: .bottom) {
            RecipeGradients.linearGradient(for: payload.name)
                .frame(minHeight: 260)

            LinearGradient(
                colors: [.clear, .black.opacity(0.6)],
                startPoint: .top,
                endPoint: .bottom
            )

            VStack(alignment: .leading, spacing: 6) {
                // "Shared with you" badge
                HStack(spacing: 5) {
                    Image(systemName: "person.fill.badge.plus")
                        .font(.system(size: 11, weight: .semibold))
                    Text("Recipe shared with you")
                        .font(.system(size: 12, weight: .semibold))
                }
                .foregroundStyle(.white.opacity(0.9))
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background(.white.opacity(0.2))
                .clipShape(Capsule())
                .padding(.bottom, 4)

                Text(RecipeEmojiMapper.emoji(
                    name: payload.name.lowercased(),
                    tags: payload.tags.map { $0.lowercased() }
                ))
                .font(.system(size: 52))

                Text(payload.name)
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 8) {
                    importPill(icon: "person.2.fill", text: "\(payload.servings.displayString) servings")
                    importPill(icon: "list.bullet", text: "\(payload.ingredients.count) ingredients")
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func importPill(icon: String, text: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 11, weight: .semibold))
            Text(text).font(.system(size: 13, weight: .semibold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(.white.opacity(0.25))
        .clipShape(Capsule())
    }

    // MARK: - Content

    private var contentArea: some View {
        VStack(spacing: 16) {
            // Tags
            if !payload.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(payload.tags, id: \.self) { tag in
                            Text(tag)
                                .font(.system(size: 13, weight: .semibold))
                                .padding(.horizontal, 12).padding(.vertical, 6)
                                .background(Color.brandGreen.opacity(0.12))
                                .foregroundStyle(Color.brandGreen)
                                .clipShape(Capsule())
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.top, 16)
            }

            // Ingredients
            if !payload.ingredients.isEmpty {
                ingredientsCard
            }

            // Instructions
            if !payload.instructions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                instructionsCard
            }

            // Bottom padding for floating bar
            Spacer().frame(height: 100)
        }
        .padding(.top, payload.tags.isEmpty ? 16 : 0)
    }

    // MARK: - Ingredients Card

    private var ingredientsCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            cardHeader(title: "Ingredients", icon: "list.bullet",
                       badge: "\(payload.ingredients.count)")

            ForEach(Array(payload.ingredients.enumerated()), id: \.offset) { idx, ing in
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

                if idx < payload.ingredients.count - 1 {
                    Divider().padding(.leading, 16)
                }
            }
            Spacer().frame(height: 8)
        }
        .cardSurface()
        .padding(.horizontal, 16)
    }

    // MARK: - Instructions Card


    private var instructionsCard: some View {
        let steps = payload.instructions
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        return VStack(alignment: .leading, spacing: 0) {
            cardHeader(title: "Instructions", icon: "text.alignleft",
                       badge: steps.count > 1 ? "\(steps.count) steps" : nil)

            if steps.count > 1 {
                ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                    HStack(alignment: .top, spacing: 14) {
                        ZStack {
                            Circle()
                                .fill(RecipeGradients.linearGradient(for: payload.name))
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
                Text(payload.instructions)
                    .font(.system(size: 15))
                    .foregroundStyle(Color(hex: "1A1A1A"))
                    .lineSpacing(4)
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
            }
            Spacer().frame(height: 8)
        }
        .cardSurface()
        .padding(.horizontal, 16)
    }

    private func cardHeader(title: String, icon: String, badge: String?) -> some View {
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

    // MARK: - Bottom Bar

    private var bottomBar: some View {
        VStack(spacing: 0) {
            Divider()
            HStack(spacing: 12) {
                if didImport {
                    HStack(spacing: 8) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(Color.brandGreen)
                        Text("Added to your library!")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color(hex: "1A1A1A"))
                    }
                    Spacer()
                    Button("Done") { dismiss() }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.brandGreen)
                } else if alreadyExists {
                    HStack(spacing: 8) {
                        Image(systemName: "info.circle")
                            .foregroundStyle(Color(hex: "888888"))
                        Text("Already in your library")
                            .font(.system(size: 15))
                            .foregroundStyle(Color(hex: "555555"))
                    }
                    Spacer()
                    Button("Dismiss") { dismiss() }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Color.brandGreen)
                } else {
                    Button(action: importRecipe) {
                        Text("Add to My Recipes")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(
                                LinearGradient(
                                    colors: [Color.brandGreen, Color.brandMid],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .background(Color.white)
        }
        .shadow(color: .black.opacity(0.06), radius: 12, x: 0, y: -4)
    }

    // MARK: - Import Logic

    private func importRecipe() {
        // Check if recipe with same name already exists
        let name = payload.name
        let descriptor = FetchDescriptor<Recipe>(predicate: #Predicate { $0.name == name })
        if let existing = try? modelContext.fetch(descriptor), !existing.isEmpty {
            withAnimation { alreadyExists = true }
            return
        }

        let recipe = Recipe(
            name: payload.name,
            servings: payload.servings,
            instructions: payload.instructions
        )
        modelContext.insert(recipe)

        for tagName in payload.tags {
            let tName = tagName
            let tagDescriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == tName })
            if let found = try? modelContext.fetch(tagDescriptor).first {
                recipe.tags.append(found)
            } else {
                let tag = Tag(name: tagName)
                modelContext.insert(tag)
                recipe.tags.append(tag)
            }
        }

        for ing in payload.ingredients {
            let ingredient = Ingredient(quantity: ing.quantity, unit: ing.unit, name: ing.name)
            modelContext.insert(ingredient)
            recipe.ingredients.append(ingredient)
        }

        try? modelContext.save()
        withAnimation(.spring(response: 0.4)) { didImport = true }
    }
}
