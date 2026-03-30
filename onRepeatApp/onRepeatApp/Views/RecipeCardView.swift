import SwiftUI

struct RecipeCardView: View {
    let recipe: Recipe
    let isSelected: Bool
    let targetServings: Double
    let onToggleSelect: () -> Void
    let onServingsChange: (Double) -> Void

    var body: some View {
        ZStack(alignment: .topTrailing) {
            NavigationLink(value: recipe) {
                cardBody
            }
            .buttonStyle(.plain)

            // Selection toggle — floats above NavigationLink hit area
            selectionCircle
                .padding(14)
        }
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(isSelected ? Color.brandGreen.opacity(0.05) : Color.cardSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18)
                .stroke(isSelected ? Color.brandGreen.opacity(0.45) : Color.clear, lineWidth: 2)
        )
        .shadow(color: isSelected
            ? Color.brandGreen.opacity(0.18)
            : Color.black.opacity(0.055),
                radius: isSelected ? 14 : 10, x: 0, y: 3)
        .animation(.spring(response: 0.3, dampingFraction: 0.75), value: isSelected)
    }

    // MARK: - Card Body

    private var cardBody: some View {
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
            thumbnail

            VStack(alignment: .leading, spacing: 5) {
                Text(recipe.name)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color(hex: "1A1A1A"))
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 5) {
                    Image(systemName: "person.2.fill")
                        .font(.system(size: 10))
                        .foregroundStyle(Color.brandGreen)
                    Text(recipe.servings.displayString)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color(hex: "555555"))

                    if !recipe.tags.isEmpty {
                        Circle()
                            .fill(Color(hex: "BBBBBB"))
                            .frame(width: 3, height: 3)
                        Text(recipe.tags.prefix(2).map(\.name).joined(separator: ", "))
                            .font(.system(size: 13))
                            .foregroundStyle(Color(hex: "555555"))
                            .lineLimit(1)
                    }
                }
            }

            // Spacer so selection circle doesn't overlap text
            Spacer()
            Color.clear.frame(width: 36)
        }
        .padding(.horizontal, 14)
        .padding(.top, 14)
        .padding(.bottom, isSelected ? 10 : 14)
    }

    private var thumbnail: some View {
        ZStack {
            RecipeGradients.linearGradient(for: recipe.name)
            Text(RecipeEmojiMapper.emoji(
                name: recipe.name.lowercased(),
                tags: recipe.tags.map { $0.name.lowercased() }
            ))
            .font(.system(size: 26))
        }
        .frame(width: 58, height: 58)
        .clipShape(RoundedRectangle(cornerRadius: 13))
    }

    private var servingsRow: some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(Color.brandGreen)
                .frame(width: 3)
                .padding(.leading, 14)

            HStack {
                Text("For this run:")
                    .font(.system(size: 13))
                    .foregroundStyle(Color(hex: "555555"))

                Spacer()

                Stepper(
                    value: Binding(
                        get: { targetServings },
                        set: { onServingsChange($0) }
                    ),
                    in: 0.5...100,
                    step: 0.5
                ) {
                    Text("\(targetServings.displayString) servings")
                        .font(.system(size: 13, weight: .semibold))
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

    // MARK: - Selection Circle

    private var selectionCircle: some View {
        Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.68)) {
                onToggleSelect()
            }
        } label: {
            ZStack {
                if isSelected {
                    Circle()
                        .fill(Color.brandGreen)
                        .frame(width: 26, height: 26)
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .black))
                        .foregroundStyle(.white)
                } else {
                    Circle()
                        .strokeBorder(Color.secondary.opacity(0.35), lineWidth: 2)
                        .frame(width: 26, height: 26)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
