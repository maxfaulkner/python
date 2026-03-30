import SwiftUI
import SwiftData

enum RecipeFormMode {
    case new
    case edit(Recipe)

    var isNew: Bool {
        if case .new = self { return true }
        return false
    }
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

    var body: some View {
        NavigationStack {
            Form {
                Section("Recipe Info") {
                    TextField("Name", text: $name)
                    HStack {
                        Text("Servings")
                        Spacer()
                        Stepper(
                            value: $servings,
                            in: 0.5...100,
                            step: 0.5
                        ) {
                            Text(servings.cleanString)
                                .monospacedDigit()
                                .frame(minWidth: 36, alignment: .trailing)
                        }
                    }
                    TextField("Tags (e.g. weeknight, vegetarian)", text: $tagsText)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section {
                    ForEach($ingredientRows) { $row in
                        IngredientRowView(row: $row)
                    }
                    .onDelete { indexSet in
                        if ingredientRows.count > 1 {
                            ingredientRows.remove(atOffsets: indexSet)
                        }
                    }
                    Button {
                        ingredientRows.append(IngredientDraft())
                    } label: {
                        Label("Add Ingredient", systemImage: "plus.circle")
                    }
                } header: {
                    HStack {
                        Text("Ingredients")
                        Spacer()
                        EditButton()
                            .font(.caption)
                            .textCase(nil)
                    }
                }

                Section("Instructions") {
                    TextEditor(text: $instructions)
                        .frame(minHeight: 140)
                }
            }
            .navigationTitle(mode.isNew ? "New Recipe" : "Edit Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            .onAppear {
                if case .edit(let recipe) = mode {
                    populate(from: recipe)
                }
            }
        }
    }

    private func populate(from recipe: Recipe) {
        name = recipe.name
        servings = recipe.servings
        instructions = recipe.instructions
        tagsText = recipe.tags.map(\.name).sorted().joined(separator: ", ")
        let rows = recipe.ingredients.map { ing in
            IngredientDraft(
                quantityText: ing.quantity.cleanString,
                unit: ing.unit,
                name: ing.name
            )
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

        // Tags
        for rawTag in tagsText.split(separator: ",") {
            let tagName = rawTag.trimmingCharacters(in: .whitespaces).lowercased()
            guard !tagName.isEmpty else { continue }
            let nameCapture = tagName
            let descriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == nameCapture })
            if let found = try? modelContext.fetch(descriptor).first {
                recipe.tags.append(found)
            } else {
                let tag = Tag(name: tagName)
                modelContext.insert(tag)
                recipe.tags.append(tag)
            }
        }

        // Ingredients
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
        HStack(spacing: 8) {
            TextField("Qty", text: $row.quantityText)
                .keyboardType(.decimalPad)
                .frame(width: 54)

            TextField("Unit", text: $row.unit)
                .frame(width: 64)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)

            TextField("Ingredient name", text: $row.name)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.words)
        }
        .font(.body)
    }
}

private extension Double {
    var cleanString: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.2f", self)
            .replacingOccurrences(of: #"0+$"#, with: "", options: .regularExpression)
    }
}
