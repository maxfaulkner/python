import SwiftUI

struct GroceryListView: View {
    @Environment(\.dismiss) private var dismiss

    let selections: [(recipe: Recipe, targetServings: Double)]

    @State private var checkedKeys: Set<String> = []

    // MARK: - Computed

    private var allItems: [CombinedIngredient] {
        IngredientCombiner.combine(selections)
    }

    private var groupedItems: [(category: GroceryCategory, items: [CombinedIngredient])] {
        let unchecked = allItems.filter { !checkedKeys.contains($0.itemKey) }
        let checked   = allItems.filter {  checkedKeys.contains($0.itemKey) }
        let combined  = unchecked + checked

        var dict: [GroceryCategory: [CombinedIngredient]] = [:]
        for item in combined { dict[item.category, default: []].append(item) }
        return dict.keys.sorted().map { (category: $0, items: dict[$0]!) }
    }

    private var totalCount: Int { allItems.count }
    private var checkedCount: Int { checkedKeys.count }
    private var progress: Double { totalCount == 0 ? 0 : Double(checkedCount) / Double(totalCount) }
    private var isComplete: Bool { totalCount > 0 && checkedCount == totalCount }

    private var recipeNames: String {
        selections.map { $0.recipe.name }.joined(separator: " · ")
    }

    private var shareText: String {
        var lines = ["Grocery List", recipeNames, ""]
        for (cat, items) in groupedItems {
            lines.append("[\(cat.rawValue)]")
            for item in items {
                let unit = item.unit.isEmpty ? "" : " \(item.unit)"
                lines.append("  • \(item.formattedQuantity)\(unit) \(item.name)")
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

                if isComplete {
                    completionView
                } else {
                    mainContent
                }
            }
            .navigationTitle("Grocery List")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(.secondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    ShareLink(item: shareText, subject: Text("Grocery List")) {
                        Image(systemName: "square.and.arrow.up")
                            .font(.system(size: 15, weight: .medium))
                    }
                }
            }
        }
    }

    // MARK: - Main Content

    private var mainContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Recipe strip
                recipeStrip

                // Progress bar
                progressBar

                // Grouped sections
                ForEach(groupedItems, id: \.category) { group in
                    categorySection(group.category, items: group.items)
                }

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
                    .shadow(color: .black.opacity(0.05), radius: 4, x: 0, y: 2)
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
                    .foregroundStyle(.secondary)
                Spacer()
                if checkedCount > 0 {
                    Button("Reset") {
                        withAnimation { checkedKeys.removeAll() }
                    }
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
                }
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.brandGreen.opacity(0.12))
                        .frame(height: 8)
                    Capsule()
                        .fill(
                            LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                                           startPoint: .leading, endPoint: .trailing)
                        )
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
            // Section header
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
                Text("\(items.filter { !checkedKeys.contains($0.itemKey) }.count) left")
                    .font(.system(size: 12))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(category.color.opacity(0.06))

            // Items
            ForEach(Array(items.enumerated()), id: \.element.id) { idx, item in
                let isChecked = checkedKeys.contains(item.itemKey)

                Button {
                    withAnimation(.spring(response: 0.25, dampingFraction: 0.7)) {
                        if isChecked { checkedKeys.remove(item.itemKey) }
                        else { checkedKeys.insert(item.itemKey) }
                    }
                } label: {
                    HStack(spacing: 12) {
                        // Checkmark
                        ZStack {
                            Circle()
                                .strokeBorder(
                                    isChecked ? category.color : Color.secondary.opacity(0.3),
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
                        HStack(spacing: 2) {
                            Text(item.formattedQuantity)
                                .font(.system(size: 15, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(isChecked ? Color.secondary : category.color)
                            if !item.unit.isEmpty {
                                Text(item.unit)
                                    .font(.system(size: 15))
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .frame(width: 72, alignment: .trailing)

                        // Name
                        Text(item.name)
                            .font(.system(size: 15))
                            .foregroundStyle(isChecked ? Color.secondary : .primary)
                            .strikethrough(isChecked, color: Color.secondary.opacity(0.5))

                        Spacer()
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(isChecked ? Color.secondary.opacity(0.04) : Color.white)
                }
                .buttonStyle(.plain)
                .animation(.easeInOut(duration: 0.2), value: isChecked)

                if idx < items.count - 1 {
                    Divider().padding(.leading, 50)
                }
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
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
                Text("All \(totalCount) items checked off.\nEnjoy cooking this week.")
                    .font(.system(size: 16))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button {
                withAnimation { checkedKeys.removeAll() }
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
}

// MARK: - Item Key

private extension CombinedIngredient {
    var itemKey: String { "\(unit)|\(name)" }
}

private extension Double {
    var displayString: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.1f", self)
    }
}
