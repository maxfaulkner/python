import SwiftUI
import SwiftData

struct ImportPreviewView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let payload: SharedRecipePayload

    @State private var imported = false
    @State private var isImporting = false

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Hero card
                        heroCard

                        if !payload.ingredients.isEmpty {
                            ingredientsCard
                        }

                        if !payload.instructions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                            instructionsCard
                        }

                        Spacer(minLength: 100)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                }

                // Bottom CTA
                importButton
            }
            .navigationTitle("Shared Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    // MARK: - Subviews

    private var heroCard: some View {
        ZStack(alignment: .bottomLeading) {
            RecipeGradients.linearGradient(for: payload.name)

            VStack(alignment: .leading, spacing: 10) {
                Text(emojiForPayload)
                    .font(.system(size: 52))

                Text(payload.name)
                    .font(.system(size: 26, weight: .black, design: .rounded))
                    .foregroundStyle(.white)

                HStack(spacing: 12) {
                    Label("\(payload.servings.cleanStr) servings", systemImage: "person.2.fill")
                    if !payload.tags.isEmpty {
                        Text("·")
                        Text(payload.tags.joined(separator: ", "))
                            .lineLimit(1)
                    }
                }
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.white.opacity(0.85))
            }
            .padding(20)
        }
        .frame(maxWidth: .infinity)
        .frame(height: 200)
        .clipShape(RoundedRectangle(cornerRadius: 20))
        .shadow(color: RecipeGradients.gradient(for: payload.name).first?.opacity(0.4) ?? .clear, radius: 16, x: 0, y: 8)
    }

    private var ingredientsCard: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Label("Ingredients", systemImage: "list.bullet")
                    .font(.system(size: 17, weight: .bold))
                Spacer()
                Text("\(payload.ingredients.count) items")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .padding(.bottom, 12)

            ForEach(Array(payload.ingredients.enumerated()), id: \.offset) { idx, ing in
                HStack(spacing: 0) {
                    Text(ing.quantity.cleanStr)
                        .font(.system(size: 15, weight: .medium))
                        .monospacedDigit()
                        .foregroundStyle(Color.brandGreen)
                        .frame(width: 44, alignment: .trailing)
                    Text(ing.unit.isEmpty ? "" : " \(ing.unit)")
                        .font(.system(size: 15))
                        .foregroundStyle(.secondary)
                        .frame(width: ing.unit.isEmpty ? 8 : 52, alignment: .leading)
                    Text(ing.name)
                        .font(.system(size: 15))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                if idx < payload.ingredients.count - 1 {
                    Divider().padding(.leading, 16)
                }
            }
            Spacer().frame(height: 8)
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 3)
    }

    private var instructionsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Instructions", systemImage: "text.alignleft")
                .font(.system(size: 17, weight: .bold))
                .padding(.horizontal, 16)
                .padding(.top, 16)

            Text(payload.instructions)
                .font(.system(size: 15))
                .lineSpacing(4)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 3)
    }

    private var importButton: some View {
        Button {
            guard !imported && !isImporting else { return }
            importRecipe()
        } label: {
            HStack(spacing: 10) {
                if isImporting {
                    ProgressView()
                        .tint(.white)
                        .scaleEffect(0.85)
                } else {
                    Image(systemName: imported ? "checkmark.circle.fill" : "plus.circle.fill")
                        .font(.system(size: 18, weight: .semibold))
                }
                Text(imported ? "Added to Your Library!" : "Add to My Library")
                    .font(.system(size: 17, weight: .semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(imported ? Color.green : Color.brandGreen)
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 16))
        }
        .disabled(imported || isImporting)
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
        .animation(.easeInOut(duration: 0.2), value: imported)
    }

    // MARK: - Logic

    private var emojiForPayload: String {
        let name = payload.name.lowercased()
        let tags = payload.tags.map { $0.lowercased() }
        return RecipeEmojiMapper.emoji(name: name, tags: tags)
    }

    private func importRecipe() {
        isImporting = true
        let recipe = Recipe(name: payload.name, servings: payload.servings, instructions: payload.instructions)
        modelContext.insert(recipe)

        for ing in payload.ingredients {
            let ingredient = Ingredient(quantity: ing.quantity, unit: ing.unit, name: ing.name)
            modelContext.insert(ingredient)
            recipe.ingredients.append(ingredient)
        }

        for rawTag in payload.tags {
            let tagName = rawTag.lowercased().trimmingCharacters(in: .whitespaces)
            guard !tagName.isEmpty else { continue }
            let name = tagName
            let descriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == name })
            if let existing = try? modelContext.fetch(descriptor).first {
                recipe.tags.append(existing)
            } else {
                let tag = Tag(name: tagName)
                modelContext.insert(tag)
                recipe.tags.append(tag)
            }
        }

        try? modelContext.save()
        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
            isImporting = false
            imported = true
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) { dismiss() }
    }
}

private extension Double {
    var cleanStr: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.2g", self)
    }
}
