import SwiftUI

// MARK: - Onboarding Page Model

private struct OnboardingPage: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let body: String
    let accentColor: Color
}

private let pages: [OnboardingPage] = [
    OnboardingPage(
        icon: "flag.checkered",
        title: "Welcome to F1 Fantasy",
        body: "Pick your drivers and constructor each race weekend. Score points based on real F1 results. Climb the leaderboard against your friends.",
        accentColor: .appRed
    ),
    OnboardingPage(
        icon: "dollarsign.circle.fill",
        title: "Budget System",
        body: "You have a fixed budget (default: 100M) to spend on 5 drivers and 1 constructor. Prices change weekly based on performance — buy low, sell high.",
        accentColor: .appGold
    ),
    OnboardingPage(
        icon: "star.circle.fill",
        title: "Captain & Chips",
        body: "Pick a captain to double their points. Use powerful chips — Triple Captain, Wildcard, No Negative — to gain an edge at the right moment.",
        accentColor: Color(hex: "a78bfa")
    ),
    OnboardingPage(
        icon: "person.3.fill",
        title: "Create or Join a League",
        body: "Set up a private league with friends, join one with an invite code, or browse public leagues. Commissioner can customise budget, scoring, and more.",
        accentColor: .appRed
    )
]

// MARK: - View

struct OnboardingView: View {
    @AppStorage("hasSeenOnboarding") private var hasSeenOnboarding = false
    @State private var currentPage = 0

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                TabView(selection: $currentPage) {
                    ForEach(Array(pages.enumerated()), id: \.offset) { index, page in
                        pageContent(page)
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Page dots
                HStack(spacing: 8) {
                    ForEach(0..<pages.count, id: \.self) { i in
                        Capsule()
                            .fill(i == currentPage ? Color.appRed : Color.appBorder)
                            .frame(width: i == currentPage ? 20 : 8, height: 8)
                            .animation(.easeInOut(duration: 0.25), value: currentPage)
                    }
                }
                .padding(.top, 8)

                // Action button
                Button {
                    if currentPage < pages.count - 1 {
                        withAnimation { currentPage += 1 }
                    } else {
                        hasSeenOnboarding = true
                    }
                } label: {
                    Text(currentPage < pages.count - 1 ? "Next" : "Get Started")
                        .fontWeight(.bold)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Color.appRed)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)
                .padding(.bottom, 40)

                if currentPage < pages.count - 1 {
                    Button("Skip") {
                        hasSeenOnboarding = true
                    }
                    .font(.footnote)
                    .foregroundStyle(.appTextDim)
                    .padding(.bottom, 12)
                }
            }
        }
    }

    private func pageContent(_ page: OnboardingPage) -> some View {
        VStack(spacing: 32) {
            Spacer()

            ZStack {
                Circle()
                    .fill(page.accentColor.opacity(0.12))
                    .frame(width: 120, height: 120)
                Image(systemName: page.icon)
                    .font(.system(size: 52, weight: .semibold))
                    .foregroundStyle(page.accentColor)
            }

            VStack(spacing: 12) {
                Text(page.title)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundStyle(.appTextPrimary)
                    .multilineTextAlignment(.center)

                Text(page.body)
                    .font(.body)
                    .foregroundStyle(.appTextDim)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
            }
            .padding(.horizontal, 32)

            Spacer()
        }
    }
}
