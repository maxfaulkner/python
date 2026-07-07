import SwiftUI

// MARK: - Card View (rendered to image)

/// A self-contained card designed to be rendered by ImageRenderer.
/// Must not reference any @Environment or @State that isn't passed in.
struct TeamCardSnapshot: View {
    let leagueName: String
    let week: Int
    let team: WeeklyTeam

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("F1 FANTASY")
                        .font(.system(size: 10, weight: .black))
                        .foregroundStyle(.appRed)
                        .tracking(2)
                    Text(leagueName)
                        .font(.headline).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                    Text("Round \(week)")
                        .font(.caption).foregroundStyle(.appTextDim)
                }
                Spacer()
                if let chip = team.chipUsed {
                    Text(chipEmoji(chip))
                        .font(.title3)
                        .padding(6)
                        .background(Color.appGold.opacity(0.2))
                        .clipShape(Circle())
                }
                VStack(alignment: .trailing, spacing: 2) {
                    if let pts = team.totalRoundPoints {
                        Text(pts > 0 ? "+\(pts)" : "\(pts)")
                            .font(.system(size: 24, weight: .bold, design: .rounded))
                            .foregroundStyle(pts >= 0 ? .appSuccess : .appError)
                        Text("pts").font(.caption2).foregroundStyle(.appTextDim)
                    }
                }
            }
            .padding(.horizontal, 16).padding(.vertical, 12)

            Color.appBorder.frame(height: 0.5)

            // Drivers
            ForEach(team.drivers) { entry in
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(constructorColor(for: entry.driver?.constructor?.name))
                        .frame(width: 3, height: 32)
                    VStack(alignment: .leading, spacing: 1) {
                        HStack(spacing: 5) {
                            Text(entry.driver?.name ?? "Unknown")
                                .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                            if team.captainId == entry.driverId {
                                Text("C")
                                    .font(.system(size: 8, weight: .bold))
                                    .foregroundStyle(.black)
                                    .frame(width: 14, height: 14)
                                    .background(Color.appGold)
                                    .clipShape(Circle())
                            }
                        }
                        Text(entry.driver?.constructor?.name ?? "")
                            .font(.caption2).foregroundStyle(.appTextDim)
                    }
                    Spacer()
                    if let pts = entry.roundPoints {
                        Text(pts > 0 ? "+\(pts)" : "\(pts)")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(pts > 0 ? .appSuccess : pts < 0 ? .appError : .appTextFaint)
                    }
                }
                .padding(.horizontal, 14).padding(.vertical, 6)
                Color.appBorder.frame(height: 0.5).padding(.leading, 14)
            }

            // Constructor
            if let ctor = team.constructors.first {
                HStack(spacing: 10) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(constructorColor(for: ctor.constructor?.name))
                        .frame(width: 3, height: 32)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ctor.constructor?.name ?? "Unknown")
                            .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                        Text("Constructor")
                            .font(.caption2).foregroundStyle(.appRed)
                    }
                    Spacer()
                    if let pts = ctor.roundPoints {
                        Text(pts > 0 ? "+\(pts)" : "\(pts)")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(pts > 0 ? .appSuccess : pts < 0 ? .appError : .appTextFaint)
                    }
                }
                .padding(.horizontal, 14).padding(.vertical, 6)
            }

            // Footer
            Color.appBorder.frame(height: 0.5)
            HStack {
                Spacer()
                Text("F1 Fantasy App")
                    .font(.system(size: 9, weight: .semibold))
                    .foregroundStyle(.appTextFaint)
                    .tracking(1)
            }
            .padding(.horizontal, 14).padding(.vertical, 6)
        }
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .frame(width: 320)
    }
}

// MARK: - Share Sheet Wrapper

struct ShareableTeamCardView: View {
    let leagueName: String
    let week: Int
    let team: WeeklyTeam

    @State private var renderedImage: UIImage?
    @State private var isSharing = false
    @State private var isRendering = false

    var body: some View {
        Button {
            renderAndShare()
        } label: {
            Label(isRendering ? "Preparing…" : "Share Team", systemImage: "square.and.arrow.up")
                .font(.subheadline).fontWeight(.semibold)
                .foregroundStyle(.appTextPrimary)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Color.appCard)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appBorder, lineWidth: 1))
        }
        .disabled(isRendering)
        .sheet(isPresented: $isSharing) {
            if let img = renderedImage {
                ShareSheet(items: [img])
            }
        }
    }

    @MainActor
    private func renderAndShare() {
        isRendering = true
        let renderer = ImageRenderer(
            content: TeamCardSnapshot(leagueName: leagueName, week: week, team: team)
                .environment(\.colorScheme, .dark)
        )
        renderer.scale = 3.0
        renderedImage = renderer.uiImage
        isRendering = false
        isSharing = true
    }
}

// MARK: - UIActivityViewController wrapper

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
