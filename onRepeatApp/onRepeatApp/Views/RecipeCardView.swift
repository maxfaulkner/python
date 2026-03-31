import SwiftUI

struct RecipeCardView: View {
    let recipe: Recipe
    let isSelected: Bool
    let targetServings: Double
    let onToggleSelect: () -> Void
    let onServingsChange: (Double) -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            // Main tap = select
            Button {
                withAnimation(.spring(response: 0.28, dampingFraction: 0.7)) {
                    onToggleSelect()
                }
            } label: {
                cardContent
            }
            .buttonStyle(.plain)

            // Detail chevron — top-right, doesn't interfere with select
            NavigationLink(value: recipe) {
                Image(systemName: "ellipsis")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(isSelected ? Color.brandGreen : Color.textDisabled)
                    .frame(width: 32, height: 32)
                    .background(isSelected ? Color.brandGreen.opacity(0.1) : Color.surfaceSecondary)
                    .clipShape(Circle())
            }
            .padding(12)
        }
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(isSelected ? Color.brandGreen.opacity(0.06) : Color.cardSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(isSelected ? Color.brandGreen : Color.clear, lineWidth: 2)
        )
        .shadow(
            color: isSelected ? Color.brandGreen.opacity(0.2) : Color.black.opacity(0.06),
            radius: isSelected ? 12 : 8, x: 0, y: 3
        )
        .animation(.spring(response: 0.3, dampingFraction: 0.75), value: isSelected)
    }

    // MARK: - Card Content

    private var cardContent: some View {
        VStack(alignment: .leading, spacing: 0) {
            mainRow
            if isSelected {
                servingsRow
                    .transition(.opacity.combined(with: .move(edge: .top)))
            }
        }
    }

    private var mainRow: some View {
        HStack(spacing: 14) {
            // Checkmark / thumbnail
            ZStack {
                if isSelected {
                    RoundedRectangle(cornerRadius: 13)
                        .fill(RecipeGradients.linearGradient(for: recipe.name))
                        .frame(width: 58, height: 58)
                    Image(systemName: "checkmark")
                        .font(.system(size: 22, weight: .black))
                        .foregroundStyle(.white)
                } else {
                    RoundedRectangle(cornerRadius: 13)
                        .fill(RecipeGradients.linearGradient(for: recipe.name))
                        .frame(width: 58, height: 58)
                    Text(RecipeEmojiMapper.emoji(
                        name: recipe.name.lowercased(),
                        tags: recipe.tags.map { $0.name.lowercased() }
                    ))
                    .font(.system(size: 26))
                }
            }
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: isSelected)

            VStack(alignment: .leading, spacing: 5) {
                Text(recipe.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.textPrimary)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 5) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.brandGreen)
                    Text(recipe.servings.displayString)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.textSecondary)

                    if !recipe.tags.isEmpty {
                        Circle()
                            .fill(Color.borderColor)
                            .frame(width: 3, height: 3)
                        Text(recipe.tags.prefix(2).map(\.name).joined(separator: ", "))
                            .font(.system(size: 13))
                            .foregroundStyle(Color.textSecondary)
                            .lineLimit(1)
                    }
                }
            }

            Spacer()
            // Space so text doesn't run under the ellipsis button
            Color.clear.frame(width: 36)
        }
        .padding(.horizontal, 14)
        .padding(.top, 14)
        .padding(.bottom, isSelected ? 10 : 14)
    }

    private var servingsRow: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(Color.brandGreen)
                .frame(width: 3)
                .padding(.leading, 14)

            HStack {
                Text("Servings for this run:")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.textSecondary)

                Spacer()

                Stepper(
                    value: Binding(
                        get: { targetServings },
                        set: { onServingsChange($0) }
                    ),
                    in: 0.5...100,
                    step: 0.5
                ) {
                    Text("\(targetServings.displayString)")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(Color.brandGreen)
                        .monospacedDigit()
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
        }
        .background(Color.brandGreen.opacity(0.05))
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: 0, bottomLeadingRadius: 14,
                bottomTrailingRadius: 14, topTrailingRadius: 0
            )
        )
    }
}
