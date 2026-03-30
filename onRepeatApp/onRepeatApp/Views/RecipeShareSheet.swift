import SwiftUI
import CoreImage

// MARK: - Share Sheet

struct RecipeShareSheet: View {
    @Environment(\.dismiss) private var dismiss
    let recipe: Recipe

    @State private var showingQR = false
    @State private var qrImage: UIImage? = nil

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                VStack(spacing: 28) {
                    // Mini recipe card preview
                    miniPreview

                    // Divider with label
                    HStack {
                        Rectangle().frame(height: 1).foregroundStyle(Color.gray.opacity(0.2))
                        Text("SHARE VIA")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(.secondary)
                            .fixedSize()
                        Rectangle().frame(height: 1).foregroundStyle(Color.gray.opacity(0.2))
                    }
                    .padding(.horizontal, 20)

                    // Share options
                    VStack(spacing: 12) {
                        if let url = RecipeShareManager.shareURL(for: recipe) {
                            ShareLink(
                                item: url,
                                subject: Text("Try this recipe: \(recipe.name)"),
                                message: Text("I saved this recipe in onRepeat and wanted to share it with you.")
                            ) {
                                shareRow(
                                    icon: "link",
                                    color: Color.brandGreen,
                                    title: "Share Link",
                                    subtitle: "Tap to open in onRepeat"
                                )
                            }
                            .buttonStyle(.plain)
                        }

                        Button {
                            if qrImage == nil { qrImage = RecipeShareManager.qrCode(for: recipe) }
                            showingQR = true
                        } label: {
                            shareRow(
                                icon: "qrcode",
                                color: Color.indigo,
                                title: "Show QR Code",
                                subtitle: "Friend scans to import instantly"
                            )
                        }
                        .buttonStyle(.plain)

                        ShareLink(
                            item: RecipeShareManager.shareText(for: recipe),
                            subject: Text(recipe.name)
                        ) {
                            shareRow(
                                icon: "text.quote",
                                color: Color.orange,
                                title: "Share as Text",
                                subtitle: "Ingredients + instructions + link"
                            )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 16)

                    Spacer()
                }
                .padding(.top, 24)
            }
            .navigationTitle("Share \"\(recipe.name)\"")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
            .sheet(isPresented: $showingQR) {
                if let qr = qrImage {
                    QRCodeView(image: qr, recipeName: recipe.name)
                }
            }
        }
    }

    // MARK: Subviews

    private var miniPreview: some View {
        HStack(spacing: 14) {
            ZStack {
                RecipeGradients.linearGradient(for: recipe.name)
                Text(RecipeEmojiMapper.emoji(name: recipe.name.lowercased(), tags: recipe.tags.map { $0.name.lowercased() }))
                    .font(.system(size: 28))
            }
            .frame(width: 56, height: 56)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 3) {
                Text(recipe.name)
                    .font(.system(size: 16, weight: .semibold))
                    .lineLimit(1)
                Text("\(recipe.servings.cleanStr) servings · \(recipe.ingredients.count) ingredients")
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .padding(.horizontal, 20)
    }

    private func shareRow(icon: String, color: Color, title: String, subtitle: String) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(color.opacity(0.12))
                    .frame(width: 44, height: 44)
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .medium))
                    .foregroundStyle(color)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 16, weight: .semibold))
                Text(subtitle)
                    .font(.system(size: 13))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Color.secondary.opacity(0.5))
        }
        .padding(14)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }
}

// MARK: - QR Code View

struct QRCodeView: View {
    @Environment(\.dismiss) private var dismiss
    let image: UIImage
    let recipeName: String

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBg.ignoresSafeArea()

                VStack(spacing: 28) {
                    Spacer()

                    // QR image with white background card
                    VStack(spacing: 16) {
                        Image(uiImage: image)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(width: 230, height: 230)

                        VStack(spacing: 4) {
                            Text(recipeName)
                                .font(.system(size: 16, weight: .bold))
                            Text("Scan to import in onRepeat")
                                .font(.system(size: 13))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(24)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 24))
                    .shadow(color: .black.opacity(0.08), radius: 24, x: 0, y: 8)

                    Spacer()

                    // Save button
                    ShareLink(
                        item: Image(uiImage: image),
                        preview: SharePreview("\(recipeName) QR Code", image: Image(uiImage: image))
                    ) {
                        Label("Save QR Code", systemImage: "square.and.arrow.down")
                            .font(.system(size: 16, weight: .semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Color.brandGreen)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal, 24)
                    .padding(.bottom, 16)
                }
            }
            .navigationTitle("QR Code")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                        .fontWeight(.semibold)
                }
            }
        }
    }
}

private extension Double {
    var cleanStr: String {
        truncatingRemainder(dividingBy: 1) == 0 ? String(Int(self)) : String(format: "%.1f", self)
    }
}
