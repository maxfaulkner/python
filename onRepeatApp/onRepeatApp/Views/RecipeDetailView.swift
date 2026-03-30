import SwiftUI
import SwiftData

struct RecipeDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    let recipe: Recipe

    @State private var showingEdit = false
    @State private var showingDeleteAlert = false

    var body: some View {
        List {
            // Header section
            Section {
                HStack {
                    Label("Servings", systemImage: "person.2")
                    Spacer()
                    Text(recipe.servings.cleanString)
                        .foregroundStyle(.secondary)
                }
                if !recipe.tags.isEmpty {
                    HStack(alignment: .top) {
                        Label("Tags", systemImage: "tag")
                        Spacer()
                        Text(recipe.tags.map(\.name).sorted().joined(separator: ", "))
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.trailing)
                    }
                }
            }

            // Ingredients section
            Section("Ingredients") {
                if recipe.ingredients.isEmpty {
                    Text("No ingredients added.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(recipe.ingredients.sorted { $0.name < $1.name }) { ingredient in
                        HStack(spacing: 8) {
                            Text(ingredient.quantity.cleanString)
                                .monospacedDigit()
                                .foregroundStyle(.secondary)
                                .frame(width: 44, alignment: .trailing)
                            if !ingredient.unit.isEmpty {
                                Text(ingredient.unit)
                                    .foregroundStyle(.secondary)
                                    .frame(width: 44, alignment: .leading)
                            }
                            Text(ingredient.name)
                        }
                    }
                }
            }

            // Instructions section
            if !recipe.instructions.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Section("Instructions") {
                    Text(recipe.instructions)
                        .lineSpacing(4)
                }
            }
        }
        .navigationTitle(recipe.name)
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button("Edit") {
                    showingEdit = true
                }
                Button(role: .destructive) {
                    showingDeleteAlert = true
                } label: {
                    Image(systemName: "trash")
                }
            }
        }
        .sheet(isPresented: $showingEdit) {
            RecipeFormView(mode: .edit(recipe))
        }
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
}

private extension Double {
    var cleanString: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.2f", self)
            .replacingOccurrences(of: #"0+$"#, with: "", options: .regularExpression)
    }
}
