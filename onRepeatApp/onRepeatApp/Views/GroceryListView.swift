import SwiftUI

// MARK: - Manual Item

private struct ManualItem: Identifiable, Codable {
    let id: UUID
    var name: String
}

// MARK: - GroceryListView

struct GroceryListView: View {
    @Environment(\.dismiss) private var dismiss

    let selections: [(recipe: Recipe, targetServings: Double)]

    // Persistent state keys are derived from the sorted recipe IDs so the
    // same selection always maps to the same UserDefaults key.
    private var persistKey: String {
        let ids = selections.map { $0.recipe.id.uuidString }.sorted().joined(separator: ",")
        return "groceryChecked_\(ids.hashValue)"
    }
    private var manualKey: String {
        let ids = selections.map { $0.recipe.id.uuidString }.sorted().joined(separator: ",")
        return "groceryManual_\(ids.hashValue)"
    }

    @State private var checkedKeys: Set<String> = []
    @State private var manualItems: [ManualItem] = []
    @State private var newItemText = ""
    @State private var showingAddField = false
    @FocusState private var addFieldFocused: Bool

    // MARK: - Computed

    private var recipeItems: [CombinedIngredient] {
        IngredientCombiner.combine(selections)
    }

    private var allItems: [CombinedIngredient] {
        let manualCombined = manualItems.map { item in
            CombinedIngredient(
                quantity: 0,
                unit: "",
                name: item.name,
                category: .other,
                sources: ["Manual"],
                manualID: item.id
            )
        }
        return recipeItems + manualCombined
    }

    private var groupedItems: [(category: GroceryCategory, items: [CombinedIngredient])] {
        var unchecked = allItems.filter { !checkedKeys.contains($0.itemKey) }
        var checked   = allItems.filter {  checkedKeys.contains($0.itemKey) }
        let combined  = unchecked + checked

        var dict: [GroceryCategory: [CombinedIngredient]] = [:]
        for item in combined { dict[item.category, default: []].append(item) }
        return dict.keys.sorted().map { (category: $0, items: dict[$0]!) }
    }

    private var totalCount: Int { allItems.count }
    private var checkedCount: Int { checkedKeys.count }
    private var progress: Double { totalCount == 0 ? 0 : Double(checkedCount) / Double(totalCount) }
    private var isComplete: Bool { totalCount > 0 && checkedCount >= totalCount }

    private var recipeNames: String {
        selections.map { $0.recipe.name }.joined(separator: " · ")
    }

    private var shareText: String {
        var lines = ["Grocery List", recipeNames, ""]
        for (cat, items) in groupedItems {
            lines.append("[\(cat.rawValue)]")
            for item in items {
                let qty = item.quantity > 0 ? "\(item.formattedQuantity) " : ""
                let unit = item.unit.isEmpty ? "" : "\(item.unit) "
                lines.append("  • \(qty)\(unit)\(item.name)")
            }
            lines.append("")
        }
        return lines.joined(separator: "\n")
    }

    // MARK: - Body

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                if isComplete && manualItems.isEmpty {
                    completionView
                } else {
                    mainContent
                }
            }
            .navigationTitle("Grocery List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.light, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color(hex: "555555"))
                }
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(item: shareText, subject: Text("Grocery List")) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.brandGreen)
                    }
                }
            }
            .onAppear {
                loadPersisted()
            }
        }
    }

    // MARK: - Main Content

    private var mainContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                recipeStrip
                progressBar

                ForEach(groupedItems, id: \.category) { group in
                    categorySection(group.category, items: group.items)
                }

                addItemSection

                Spacer(minLength: 30)
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
        }
    }

    // MARK: - Recipe Strip

    private var recipeStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(selections, id: \.recipe.id) { sel in
                    HStack(spacing: 7) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(RecipeGradients.linearGradient(for: sel.recipe.name))
                                .frame(width: 22, height: 22)
                            Text(RecipeEmojiMapper.emoji(
                                name: sel.recipe.name.lowercased(),
                                tags: sel.recipe.tags.map { $0.name.lowercased() }
                            ))
                            .font(.system(size: 11))
                        }
                        Text(sel.recipe.name)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color(hex: "1A1A1A"))
                            .lineLimit(1)
                        if sel.targetServings != sel.recipe.servings {
                            Text("×\(sel.targetServings.displayString)")
                                .font(.system(size: 11, weight: .semibold))
                                .foregroundStyle(Color.brandGreen)
                        }
                    }
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.white)
                    .clipShape(Capsule())
                    .shadow(color: .black.opacity(0.07), radius: 4, x: 0, y: 2)
                }
            }
            .padding(.horizontal, 2).padding(.vertical, 2)
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        VStack(spacing: 8) {
            HStack {
                Text("\(checkedCount) of \(totalCount) items")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color(hex: "555555"))
                Spacer()
                if checkedCount > 0 {
                    Button("Reset") {
                        withAnimation { checkedKeys.removeAll() }
                        saveChecked()
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(Color(hex: "888888"))
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.brandGreen.opacity(0.12))
                        .frame(height: 8)
                    Capsule()
                        .fill(LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                                             startPoint: .leading, endPoint: .trailing))
                        .frame(width: geo.size.width * progress, height: 8)
                        .animation(.spring(response: 0.4, dampingFraction: 0.75), value: progress)
                }
            }
            .frame(height: 8)
        }
        .padding(14)
        .cardSurface()
    }

    // MARK: - Category Section

    private func categorySection(_ category: GroceryCategory, items: [CombinedIngredient]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(category.color.opacity(0.15))
                        .frame(width: 28, height: 28)
                    Image(systemName: category.systemImage)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(category.color)
                }
                Text(category.rawValue)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(category.color)
                Spacer()
                let remaining = items.filter { !checkedKeys.contains($0.itemKey) }.count
                if remaining > 0 {
                    Text("\(remaining) left")
                        .font(.system(size: 12))
                        .foregroundStyle(Color(hex: "888888"))
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(category.color.opacity(0.07))

            // Items
            ForEach(Array(items.enumerated()), id: \.element.id) { idx, item in
                itemRow(item: item, category: category, isLast: idx == items.count - 1)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    // MARK: - Item Row

    private func itemRow(item: CombinedIngredient, category: GroceryCategory, isLast: Bool) -> some View {
        let isChecked = checkedKeys.contains(item.itemKey)
        let isManual = item.manualID != nil

        return VStack(spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                    if isChecked { checkedKeys.remove(item.itemKey) }
                    else { checkedKeys.insert(item.itemKey) }
                }
                saveChecked()
            } label: {
                HStack(spacing: 12) {
                    // Checkmark circle
                    ZStack {
                        Circle()
                            .strokeBorder(
                                isChecked ? category.color : Color(hex: "CCCCCC"),
                                lineWidth: 2
                            )
                            .frame(width: 24, height: 24)
                        if isChecked {
                            Circle()
                                .fill(category.color)
                                .frame(width: 24, height: 24)
                            Image(systemName: "checkmark")
                                .font(.system(size: 10, weight: .black))
                                .foregroundStyle(.white)
                        }
                    }

                    // Quantity + unit
                    if item.quantity > 0 {
                        HStack(spacing: 2) {
                            Text(item.formattedQuantity)
                                .font(.system(size: 15, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(isChecked ? Color(hex: "AAAAAA") : category.color)
                            if !item.unit.isEmpty {
                                Text(item.unit)
                                    .font(.system(size: 15))
                                    .foregroundStyle(Color(hex: "888888"))
                            }
                        }
                        .frame(width: 72, alignment: .trailing)
                    }

                    // Name + source attribution
                    VStack(alignment: .leading, spacing: 2) {
                        Text(item.name)
                            .font(.system(size: 15))
                            .foregroundStyle(isChecked ? Color(hex: "AAAAAA") : Color(hex: "1A1A1A"))
                            .strikethrough(isChecked, color: Color(hex: "AAAAAA"))

                        // Attribution — show when more than one recipe or when manual
                        if !isManual && item.sources.count > 0 && selections.count > 1 {
                            Text(item.sources.joined(separator: ", "))
                                .font(.system(size: 11))
                                .foregroundStyle(isChecked ? Color(hex: "BBBBBB") : Color(hex: "999999"))
                                .lineLimit(1)
                        } else if isManual {
                            Text("added manually")
                                .font(.system(size: 11))
                                .foregroundStyle(isChecked ? Color(hex: "BBBBBB") : Color(hex: "BBBBBB"))
                        }
                    }

                    Spacer()

                    // Delete button for manual items
                    if isManual, let mid = item.manualID {
                        Button {
                            withAnimation {
                                manualItems.removeAll { $0.id == mid }
                                checkedKeys.remove(item.itemKey)
                            }
                            saveManual()
                            saveChecked()
                        } label: {
                            Image(systemName: "minus.circle.fill")
                                .font(.system(size: 18))
                                .foregroundStyle(Color(hex: "CCCCCC"))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(isChecked ? Color(hex: "F8F8F8") : Color.white)
            }
            .buttonStyle(.plain)
            .animation(.easeInOut(duration: 0.2), value: isChecked)

            if !isLast {
                Divider().padding(.leading, 50)
            }
        }
    }

    // MARK: - Add Item Section

    private var addItemSection: some View {
        VStack(spacing: 0) {
            if showingAddField {
                HStack(spacing: 10) {
                    TextField("e.g. paper towels", text: $newItemText)
                        .font(.system(size: 15))
                        .foregroundStyle(Color(hex: "1A1A1A"))
                        .focused($addFieldFocused)
                        .onSubmit { commitNewItem() }

                    Button("Add") { commitNewItem() }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(newItemText.trimmingCharacters(in: .whitespaces).isEmpty
                                         ? Color(hex: "BBBBBB")
                                         : Color.brandGreen)
                        .disabled(newItemText.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .shadow(color: .black.opacity(0.06), radius: 6, x: 0, y: 2)
                .transition(.move(edge: .top).combined(with: .opacity))
            }

            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                    showingAddField.toggle()
                    if showingAddField { addFieldFocused = true }
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: showingAddField ? "minus.circle" : "plus.circle")
                        .font(.system(size: 14, weight: .semibold))
                    Text(showingAddField ? "Cancel" : "Add item manually")
                        .font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(showingAddField ? Color(hex: "888888") : Color.brandGreen)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
            }
        }
    }

    // MARK: - Completion View

    private var completionView: some View {
        VStack(spacing: 24) {
            Spacer()

            ZStack {
                Circle()
                    .fill(Color.brandGreen.opacity(0.1))
                    .frame(width: 120, height: 120)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(Color.brandGreen)
            }

            VStack(spacing: 8) {
                Text("You're all set!")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(Color(hex: "1A1A1A"))
                Text("All \(totalCount) items checked off.\nEnjoy cooking this week.")
                    .font(.system(size: 16))
                    .foregroundStyle(Color(hex: "666666"))
                    .multilineTextAlignment(.center)
            }

            Button {
                withAnimation { checkedKeys.removeAll() }
                saveChecked()
            } label: {
                Label("Start Over", systemImage: "arrow.counterclockwise")
                    .font(.system(size: 16, weight: .semibold))
                    .padding(.horizontal, 28).padding(.vertical, 13)
                    .background(Color.brandGreen.opacity(0.1))
                    .foregroundStyle(Color.brandGreen)
                    .clipShape(Capsule())
            }

            Spacer()
        }
    }

    // MARK: - Actions

    private func commitNewItem() {
        let trimmed = newItemText.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        withAnimation {
            manualItems.append(ManualItem(id: UUID(), name: trimmed.lowercased()))
            newItemText = ""
        }
        saveManual()
    }

    // MARK: - Persistence

    private func saveChecked() {
        let arr = Array(checkedKeys)
        if let data = try? JSONEncoder().encode(arr) {
            UserDefaults.standard.set(data, forKey: persistKey)
        }
    }

    private func saveManual() {
        if let data = try? JSONEncoder().encode(manualItems) {
            UserDefaults.standard.set(data, forKey: manualKey)
        }
    }

    private func loadPersisted() {
        if let data = UserDefaults.standard.data(forKey: persistKey),
           let arr = try? JSONDecoder().decode([String].self, from: data) {
            checkedKeys = Set(arr)
        }
        if let data = UserDefaults.standard.data(forKey: manualKey),
           let items = try? JSONDecoder().decode([ManualItem].self, from: data) {
            manualItems = items
        }
    }
}

// MARK: - Item Key

private extension CombinedIngredient {
    var itemKey: String {
        if let mid = manualID { return "manual_\(mid.uuidString)" }
        return "\(unit)|\(name)"
    }
}
