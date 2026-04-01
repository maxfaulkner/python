import SwiftUI
import SwiftData

struct GroceryListView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Bindable var groceryList: GroceryList

    // Local state kept in sync with model
    @State private var checkedKeys: Set<String> = []
    @State private var manualItems: [GroceryManualItem] = []
    @State private var newItemText = ""
    @State private var showingAddField = false
    @FocusState private var addFieldFocused: Bool

    // MARK: - Computed

    private var groupedItems: [(category: GroceryCategory, items: [AnyGroceryRow])] {
        let recipeRows = groceryList.items.map { AnyGroceryRow.recipe($0) }
        let manualRows = manualItems.map { AnyGroceryRow.manual($0) }
        let all = recipeRows + manualRows

        let unchecked = all.filter { !checkedKeys.contains($0.itemKey) }
        let checked   = all.filter {  checkedKeys.contains($0.itemKey) }
        let combined  = unchecked + checked

        var dict: [GroceryCategory: [AnyGroceryRow]] = [:]
        for row in combined { dict[row.category, default: []].append(row) }
        return dict.keys.sorted().map { (category: $0, items: dict[$0]!) }
    }

    private var totalCount: Int { groceryList.snapshotItemCount + manualItems.count }
    private var checkedCount: Int { checkedKeys.count }
    private var progress: Double { totalCount == 0 ? 0 : Double(checkedCount) / Double(totalCount) }
    private var isComplete: Bool { totalCount > 0 && checkedCount >= totalCount }

    private var shareText: String {
        var lines = [groceryList.name, groceryList.recipeNames.joined(separator: " · "), ""]
        for (cat, rows) in groupedItems {
            lines.append("[\(cat.rawValue)]")
            for row in rows {
                let qty = row.formattedQty.isEmpty ? "" : "\(row.formattedQty) "
                let unit = row.unit.isEmpty ? "" : "\(row.unit) "
                lines.append("  • \(qty)\(unit)\(row.name)")
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
            .navigationTitle(groceryList.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color.textSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(item: shareText, subject: Text(groceryList.name)) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(Color.brandGreen)
                    }
                }
            }
        }
        .onAppear {
            checkedKeys = Set(groceryList.checkedKeys)
            manualItems = groceryList.manualItems
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
                ForEach(groceryList.recipeNames, id: \.self) { recipeName in
                    HStack(spacing: 7) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 6)
                                .fill(RecipeGradients.linearGradient(for: recipeName))
                                .frame(width: 22, height: 22)
                            Text(RecipeEmojiMapper.emoji(name: recipeName.lowercased(), tags: []))
                                .font(.system(size: 11))
                        }
                        Text(recipeName)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(Color.textPrimary)
                            .lineLimit(1)
                    }
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Color.cardSurface)
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
                    .foregroundStyle(Color.textSecondary)
                Spacer()
                if checkedCount > 0 {
                    Button("Reset") {
                        withAnimation { checkedKeys.removeAll() }
                        persist()
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(Color.textTertiary)
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

    private func categorySection(_ category: GroceryCategory, items: [AnyGroceryRow]) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack(spacing: 8) {
                ZStack {
                    Circle().fill(category.color.opacity(0.15)).frame(width: 28, height: 28)
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
                        .foregroundStyle(Color.textTertiary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(category.color.opacity(0.07))

            ForEach(Array(items.enumerated()), id: \.element.itemKey) { idx, row in
                itemRow(row: row, category: category, isLast: idx == items.count - 1)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    // MARK: - Item Row

    private func itemRow(row: AnyGroceryRow, category: GroceryCategory, isLast: Bool) -> some View {
        let isChecked = checkedKeys.contains(row.itemKey)

        return VStack(spacing: 0) {
            Button {
                withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                    if isChecked { checkedKeys.remove(row.itemKey) }
                    else { checkedKeys.insert(row.itemKey) }
                }
                persist()
            } label: {
                HStack(spacing: 12) {
                    // Check circle
                    ZStack {
                        Circle()
                            .strokeBorder(isChecked ? category.color : Color.borderColor, lineWidth: 2)
                            .frame(width: 24, height: 24)
                        if isChecked {
                            Circle().fill(category.color).frame(width: 24, height: 24)
                            Image(systemName: "checkmark")
                                .font(.system(size: 10, weight: .black))
                                .foregroundStyle(.white)
                        }
                    }

                    // Quantity + unit
                    if !row.formattedQty.isEmpty {
                        HStack(spacing: 2) {
                            Text(row.formattedQty)
                                .font(.system(size: 15, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(isChecked ? Color.textDisabled : category.color)
                            if !row.unit.isEmpty {
                                Text(row.unit)
                                    .font(.system(size: 15))
                                    .foregroundStyle(Color.textTertiary)
                            }
                        }
                        .frame(width: 72, alignment: .trailing)
                    }

                    // Name + attribution
                    VStack(alignment: .leading, spacing: 2) {
                        Text(row.name)
                            .font(.system(size: 15))
                            .foregroundStyle(isChecked ? Color.textDisabled : Color.textPrimary)
                            .strikethrough(isChecked, color: Color.textDisabled)

                        if !row.sources.isEmpty && groceryList.recipeNames.count > 1 {
                            Text(row.sources.joined(separator: ", "))
                                .font(.system(size: 11))
                                .foregroundStyle(isChecked ? Color.textDisabled : Color.textTertiary)
                                .lineLimit(1)
                        } else if row.isManual {
                            Text("added manually")
                                .font(.system(size: 11))
                                .foregroundStyle(Color.textDisabled)
                        }
                    }

                    Spacer()

                    // Delete button for manual items
                    if row.isManual, case .manual(let item) = row {
                        Button {
                            withAnimation {
                                manualItems.removeAll { $0.id == item.id }
                                checkedKeys.remove(row.itemKey)
                            }
                            persist()
                        } label: {
                            Image(systemName: "minus.circle.fill")
                                .font(.system(size: 18))
                                .foregroundStyle(Color.borderColor)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(isChecked ? Color.surfaceSecondary : Color.cardSurface)
            }
            .buttonStyle(.plain)
            .animation(.easeInOut(duration: 0.2), value: isChecked)

            if !isLast { Divider().padding(.leading, 50) }
        }
    }

    // MARK: - Add Item

    private var addItemSection: some View {
        VStack(spacing: 0) {
            if showingAddField {
                HStack(spacing: 10) {
                    TextField("e.g. paper towels", text: $newItemText)
                        .font(.system(size: 15))
                        .foregroundStyle(Color.textPrimary)
                        .focused($addFieldFocused)
                        .onSubmit { commitNewItem() }

                    Button("Add") { commitNewItem() }
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(newItemText.trimmingCharacters(in: .whitespaces).isEmpty
                                         ? Color.textDisabled : Color.brandGreen)
                        .disabled(newItemText.trimmingCharacters(in: .whitespaces).isEmpty)
                }
                .padding(.horizontal, 16).padding(.vertical, 14)
                .background(Color.cardSurface)
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
                .foregroundStyle(showingAddField ? Color.textTertiary : Color.brandGreen)
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
                Circle().fill(Color.brandGreen.opacity(0.1)).frame(width: 120, height: 120)
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(Color.brandGreen)
            }
            VStack(spacing: 8) {
                Text("All done!")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(Color.textPrimary)
                Text("All \(totalCount) items checked off.")
                    .font(.system(size: 16))
                    .foregroundStyle(Color.textSecondary)
            }
            Button {
                withAnimation { checkedKeys.removeAll() }
                persist()
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

    // MARK: - Helpers

    private func commitNewItem() {
        let trimmed = newItemText.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        withAnimation {
            manualItems.append(GroceryManualItem(id: UUID(), name: trimmed.lowercased()))
            newItemText = ""
        }
        persist()
    }

    private func persist() {
        groceryList.checkedKeys = Array(checkedKeys)
        if let data = try? JSONEncoder().encode(manualItems),
           let str = String(data: data, encoding: .utf8) {
            groceryList.manualItemsJSONString = str
        }
        try? modelContext.save()
    }
}

// MARK: - AnyGroceryRow (union of recipe item and manual item)

enum AnyGroceryRow {
    case recipe(SavedGroceryItem)
    case manual(GroceryManualItem)

    var itemKey: String {
        switch self {
        case .recipe(let i): return "\(i.unit)|\(i.name)"
        case .manual(let i): return "manual_\(i.id.uuidString)"
        }
    }

    var name: String {
        switch self {
        case .recipe(let i): return i.name
        case .manual(let i): return i.name
        }
    }

    var unit: String {
        switch self {
        case .recipe(let i): return i.unit
        case .manual: return ""
        }
    }

    var formattedQty: String {
        switch self {
        case .recipe(let i): return i.formattedQuantity
        case .manual: return ""
        }
    }

    var category: GroceryCategory {
        switch self {
        case .recipe(let i): return i.category
        case .manual: return .other
        }
    }

    var sources: [String] {
        switch self {
        case .recipe(let i): return i.sources
        case .manual: return []
        }
    }

    var isManual: Bool {
        if case .manual = self { return true }
        return false
    }
}
