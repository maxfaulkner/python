import SwiftUI

struct RecipeShareSheet: View {
    @Environment(\.dismiss) private var dismiss

    let recipe: Recipe

    @State private var showingQR = false
    @State private var copied = false

    private var shareURL: URL? { RecipeShareManager.shareURL(for: recipe) }
    private var shareText: String { RecipeShareManager.shareText(for: recipe) }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        previewCard
                        actionsCard
                        Spacer(minLength: 20)
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
                }
            }
            .navigationTitle("Share Recipe")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.light, for: .navigationBar) // system adapts in dark mode
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.brandGreen)
                }
            }
        }
    }

    // MARK: - Preview Card

    private var previewCard: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                RecipeGradients.linearGradient(for: recipe.name)
                    .frame(height: 140)

                LinearGradient(
                    colors: [.clear, .black.opacity(0.5)],
                    startPoint: .top,
                    endPoint: .bottom
                )

                HStack(spacing: 12) {
                    Text(RecipeEmojiMapper.emoji(
                        name: recipe.name.lowercased(),
                        tags: recipe.tags.map { $0.name.lowercased() }
                    ))
                    .font(.system(size: 36))

                    VStack(alignment: .leading, spacing: 3) {
                        Text(recipe.name)
                            .font(.system(size: 18, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                        Text("\(recipe.servings.displayString) servings · \(recipe.ingredients.count) ingredients")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.85))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 14)
            }
            .clipShape(UnevenRoundedRectangle(
                topLeadingRadius: 16, bottomLeadingRadius: 0,
                bottomTrailingRadius: 0, topTrailingRadius: 16
            ))

            if !recipe.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(recipe.tags.sorted { $0.name < $1.name }) { tag in
                            Text(tag.name)
                                .font(.system(size: 12, weight: .semibold))
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(Color.brandGreen.opacity(0.1))
                                .foregroundStyle(Color.brandGreen)
                                .clipShape(Capsule())
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .background(Color.cardSurface)
                .clipShape(UnevenRoundedRectangle(
                    topLeadingRadius: 0, bottomLeadingRadius: 16,
                    bottomTrailingRadius: 16, topTrailingRadius: 0
                ))
            }
        }
        .shadow(color: .black.opacity(0.08), radius: 12, x: 0, y: 4)
    }

    // MARK: - Actions Card

    private var actionsCard: some View {
        VStack(spacing: 0) {

            if let url = shareURL {
                actionRow(
                    icon: "link",
                    iconColor: Color(hex: "0A84FF"),
                    title: copied ? "Copied!" : "Copy Link",
                    subtitle: "Anyone with the app can open it",
                    tinted: copied
                ) {
                    UIPasteboard.general.string = url.absoluteString
                    withAnimation(.spring(response: 0.3)) { copied = true }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                        withAnimation { copied = false }
                    }
                }

                Divider().padding(.leading, 58)

                ShareLink(item: url, subject: Text(recipe.name), message: Text("Check out this recipe on onRepeat!")) {
                    actionRowLabel(
                        icon: "square.and.arrow.up",
                        iconColor: Color.brandGreen,
                        title: "Share via…",
                        subtitle: "Messages, AirDrop, email, and more"
                    )
                }
                .buttonStyle(.plain)

                Divider().padding(.leading, 58)
            }

            actionRow(
                icon: "qrcode",
                iconColor: Color.textPrimary,
                title: "Show QR Code",
                subtitle: "Let someone scan to get the recipe",
                tinted: false
            ) {
                showingQR = true
            }

            Divider().padding(.leading, 58)

            ShareLink(item: shareText, subject: Text(recipe.name)) {
                actionRowLabel(
                    icon: "doc.text",
                    iconColor: Color.textTertiary,
                    title: "Share as Plain Text",
                    subtitle: "Paste into messages, notes, or email"
                )
            }
            .buttonStyle(.plain)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 2)
        .sheet(isPresented: $showingQR) { QRCodeView(recipe: recipe) }
    }

    private func actionRow(
        icon: String,
        iconColor: Color,
        title: String,
        subtitle: String,
        tinted: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            actionRowLabel(icon: icon, iconColor: iconColor, title: title, subtitle: subtitle)
                .background(tinted ? Color.brandGreen.opacity(0.04) : Color.cardSurface)
        }
        .buttonStyle(.plain)
    }

    private func actionRowLabel(
        icon: String,
        iconColor: Color,
        title: String,
        subtitle: String
    ) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(iconColor.opacity(0.12))
                    .frame(width: 40, height: 40)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(iconColor)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Color.textPrimary)
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.textTertiary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.borderColor)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.cardSurface)
    }
}

// MARK: - QR Code View

struct QRCodeView: View {
    @Environment(\.dismiss) private var dismiss
    let recipe: Recipe

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                VStack(spacing: 28) {
                    VStack(spacing: 6) {
                        Text(RecipeEmojiMapper.emoji(
                            name: recipe.name.lowercased(),
                            tags: recipe.tags.map { $0.name.lowercased() }
                        ))
                        .font(.system(size: 44))

                        Text(recipe.name)
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.textPrimary)
                            .multilineTextAlignment(.center)
                    }

                    if let qr = RecipeShareManager.qrCode(for: recipe, size: 260) {
                        Image(uiImage: qr)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 260, height: 260)
                            .padding(20)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 20))
                            .shadow(color: .black.opacity(0.1), radius: 16, x: 0, y: 4)
                    } else {
                        RoundedRectangle(cornerRadius: 20)
                            .fill(Color.white)
                            .frame(width: 260, height: 260)
                            .overlay(
                                Text("Could not generate QR")
                                    .foregroundStyle(Color.textTertiary)
                            )
                    }

                    Text("Point the camera at this code\nto import the recipe")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.textTertiary)
                        .multilineTextAlignment(.center)

                    Spacer()
                }
                .padding(.top, 32)
                .padding(.horizontal, 24)
            }
            .navigationTitle("Scan to Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.light, for: .navigationBar) // system adapts in dark mode
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.brandGreen)
                }
            }
        }
    }
}
