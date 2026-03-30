import SwiftUI
import SwiftData

enum RecipeFormMode {
    case new
    case edit(Recipe)
    var isNew: Bool { if case .new = self { return true }; return false }
}

struct IngredientDraft: Identifiable {
    var id = UUID()
    var quantityText: String = ""
    var unit: String = ""
    var name: String = ""
}

struct RecipeFormView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let mode: RecipeFormMode

    @State private var name = ""
    @State private var servings = 4.0
    @State private var instructions = ""
    @State private var tagsText = ""
    @State private var ingredientRows: [IngredientDraft] = [IngredientDraft()]
    @State private var tagChips: [String] = []

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        infoSection
                        ingredientsSection
                        instructionsSection
                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 16)
                }
            }
            .navigationTitle(mode.isNew ? "New Recipe" : "Edit Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.light, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color(hex: "666666"))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save", action: save)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundStyle(name.trimmingCharacters(in: .whitespaces).isEmpty
                                         ? Color(hex: "BBBBBB") : Color.brandGreen)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                if case .edit(let r) = mode { populate(from: r) }
            }
        }
    }

    // MARK: - Sections

    private var infoSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            formSectionHeader("Recipe Info", icon: "info.circle")

            VStack(spacing: 0) {
                // Name
                VStack(alignment: .leading, spacing: 4) {
                    Text("NAME").formLabel()
                    TextField("e.g. Pasta Bolognese", text: $name)
                        .font(.system(size: 17))
                }
                .padding(16)

                Divider().padding(.horizontal, 16)

                // Servings
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("SERVINGS").formLabel()
                        Text(servings.displayString)
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(Color.brandGreen)
                    }
                    Spacer()
                    Stepper("", value: $servings, in: 0.5...100, step: 0.5)
                        .labelsHidden()
                }
                .padding(16)

                Divider().padding(.horizontal, 16)

                // Tags
                VStack(alignment: .leading, spacing: 8) {
                    Text("TAGS").formLabel()
                    HStack {
                        TextField("Add a tag…", text: $tagsText)
                            .font(.system(size: 15))
                            .autocorrectionDisabled()
                            .textInputAutocapitalization(.never)
                            .onSubmit { addTag() }
                        Button(action: addTag) {
                            Image(systemName: "return")
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(Color.brandGreen)
                        }
                        .buttonStyle(.plain)
                    }
                    if !tagChips.isEmpty {
                        FlowLayout(spacing: 6) {
                            ForEach(tagChips, id: \.self) { tag in
                                HStack(spacing: 4) {
                                    Text(tag)
                                        .font(.system(size: 13, weight: .medium))
                                    Button {
                                        tagChips.removeAll { $0 == tag }
                                    } label: {
                                        Image(systemName: "xmark")
                                            .font(.system(size: 9, weight: .bold))
                                    }
                                    .buttonStyle(.plain)
                                }
                                .padding(.horizontal, 10).padding(.vertical, 5)
                                .background(Color.brandGreen.opacity(0.1))
                                .foregroundStyle(Color.brandGreen)
                                .clipShape(Capsule())
                            }
                        }
                    }
                }
                .padding(16)
            }
            .cardSurface()
        }
    }

    private var ingredientsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                formSectionHeader("Ingredients", icon: "list.bullet")
                Spacer()
                EditButton()
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.brandGreen)
                    .padding(.top, 2)
            }

            VStack(spacing: 0) {
                // Column header
                HStack(spacing: 0) {
                    Text("QTY").frame(width: 56, alignment: .center)
                    Text("UNIT").frame(width: 64, alignment: .leading)
                    Text("INGREDIENT")
                    Spacer()
                }
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Color.secondary)
                .padding(.horizontal, 16).padding(.vertical, 8)
                .background(Color.brandGreen.opacity(0.04))

                Divider()

                List {
                    ForEach($ingredientRows) { $row in
                        IngredientRowView(row: $row)
                            .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 0, trailing: 16))
                            .listRowBackground(Color.white)
                            .listRowSeparatorTint(Color.secondary.opacity(0.2))
                    }
                    .onDelete { ingredientRows.count > 1 ? ingredientRows.remove(atOffsets: $0) : () }

                    Button {
                        withAnimation { ingredientRows.append(IngredientDraft()) }
                    } label: {
                        Label("Add Ingredient", systemImage: "plus.circle.fill")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.brandGreen)
                    }
                    .listRowBackground(Color.white)
                    .listRowSeparator(.hidden)
                    .padding(.vertical, 4)
                }
                .listStyle(.plain)
                .frame(height: CGFloat(ingredientRows.count) * 52 + 52)
                .scrollDisabled(true)
            }
            .cardSurface()
        }
    }

    private var instructionsSection: some View {
        VStack(alignment: .leading, spacing: 0) {
            formSectionHeader("Instructions", icon: "text.alignleft")

            VStack(alignment: .leading, spacing: 6) {
                Text("One step per line — the app will number them automatically.")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 16)
                    .padding(.top, 4)

                TextEditor(text: $instructions)
                    .font(.system(size: 15))
                    .lineSpacing(3)
                    .frame(minHeight: 160)
                    .padding(.horizontal, 12)
                    .scrollContentBackground(.hidden)
            }
            .padding(.bottom, 12)
            .cardSurface()
        }
    }

    // MARK: - Helpers

    private func formSectionHeader(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
            .padding(.leading, 4)
            .padding(.bottom, 6)
    }

    private func addTag() {
        let tag = tagsText.trimmingCharacters(in: .whitespaces).lowercased()
        guard !tag.isEmpty, !tagChips.contains(tag) else { tagsText = ""; return }
        withAnimation { tagChips.append(tag) }
        tagsText = ""
    }

    private func populate(from recipe: Recipe) {
        name = recipe.name
        servings = recipe.servings
        instructions = recipe.instructions
        tagChips = recipe.tags.map(\.name).sorted()
        let rows = recipe.ingredients.map {
            IngredientDraft(quantityText: $0.quantity.displayString, unit: $0.unit, name: $0.name)
        }
        ingredientRows = rows.isEmpty ? [IngredientDraft()] : rows
    }

    private func save() {
        let trimmedName = name.trimmingCharacters(in: .whitespaces)
        guard !trimmedName.isEmpty else { return }

        let recipe: Recipe
        switch mode {
        case .new:
            recipe = Recipe(name: trimmedName, servings: servings, instructions: instructions)
            modelContext.insert(recipe)
        case .edit(let existing):
            recipe = existing
            recipe.name = trimmedName
            recipe.servings = servings
            recipe.instructions = instructions
            let old = recipe.ingredients
            recipe.ingredients.removeAll()
            old.forEach { modelContext.delete($0) }
            recipe.tags.removeAll()
        }

        for tagName in tagChips {
            let name = tagName
            let descriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == name })
            if let found = try? modelContext.fetch(descriptor).first {
                recipe.tags.append(found)
            } else {
                let tag = Tag(name: tagName)
                modelContext.insert(tag)
                recipe.tags.append(tag)
            }
        }

        for row in ingredientRows {
            let ingName = row.name.trimmingCharacters(in: .whitespaces)
            guard !ingName.isEmpty else { continue }
            let normalized = row.quantityText.replacingOccurrences(of: ",", with: ".")
            guard let qty = Double(normalized), qty > 0 else { continue }
            let ingredient = Ingredient(quantity: qty, unit: row.unit, name: ingName)
            modelContext.insert(ingredient)
            recipe.ingredients.append(ingredient)
        }

        try? modelContext.save()
        dismiss()
    }
}

// MARK: - Ingredient Row

private struct IngredientRowView: View {
    @Binding var row: IngredientDraft

    var body: some View {
        HStack(spacing: 0) {
            TextField("0", text: $row.quantityText)
                .keyboardType(.decimalPad)
                .font(.system(size: 15, weight: .medium))
                .multilineTextAlignment(.center)
                .frame(width: 56)

            TextField("unit", text: $row.unit)
                .font(.system(size: 15))
                .frame(width: 64)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)

            TextField("ingredient name", text: $row.name)
                .font(.system(size: 15))
                .autocorrectionDisabled()
                .textInputAutocapitalization(.words)
        }
        .padding(.vertical, 13)
    }
}

// MARK: - Flow Layout (for tag chips)

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        let height = rows.map { $0.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0 }.reduce(0, +)
            + CGFloat(max(rows.count - 1, 0)) * spacing
        return CGSize(width: proposal.width ?? 0, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = computeRows(proposal: proposal, subviews: subviews)
        var y = bounds.minY
        for row in rows {
            let rowHeight = row.map { $0.sizeThatFits(.unspecified).height }.max() ?? 0
            var x = bounds.minX
            for view in row {
                let size = view.sizeThatFits(.unspecified)
                view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += rowHeight + spacing
        }
    }

    private func computeRows(proposal: ProposedViewSize, subviews: Subviews) -> [[LayoutSubview]] {
        var rows: [[LayoutSubview]] = [[]]
        var x: CGFloat = 0
        let maxWidth = proposal.width ?? .infinity
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && !rows.last!.isEmpty {
                rows.append([])
                x = 0
            }
            rows[rows.count - 1].append(view)
            x += size.width + spacing
        }
        return rows
    }
}

// MARK: - Label Extension

private extension Text {
    func formLabel() -> some View {
        self
            .font(.system(size: 10, weight: .semibold))
            .foregroundStyle(Color.secondary)
            .textCase(.uppercase)
    }
}
