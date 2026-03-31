import SwiftUI

struct CookModeView: View {
    @Environment(\.dismiss) private var dismiss

    let recipe: Recipe

    @State private var currentStep = 0
    @State private var showingExitAlert = false
    @State private var completedSteps: Set<Int> = []

    // MARK: - Steps

    private var steps: [String] {
        recipe.instructions
            .components(separatedBy: "\n")
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
    }

    private var isSingleBlock: Bool { steps.count <= 1 }
    private var progress: Double {
        isSingleBlock ? 1.0 : Double(currentStep + 1) / Double(steps.count)
    }

    // MARK: - Body

    var body: some View {
        ZStack {
            // Deep gradient background — uses recipe's palette with darkened base
            RecipeGradients.linearGradient(for: recipe.name)
                .overlay(Color.black.opacity(0.55))
                .ignoresSafeArea()

            VStack(spacing: 0) {
                topBar
                Spacer(minLength: 0)

                if isSingleBlock {
                    singleBlockContent
                } else {
                    stepContent
                }

                Spacer(minLength: 0)

                if !isSingleBlock {
                    bottomNav
                }
            }
        }
        .alert("Exit Cook Mode?", isPresented: $showingExitAlert) {
            Button("Exit", role: .destructive) { dismiss() }
            Button("Keep Cooking", role: .cancel) {}
        } message: {
            Text("You'll lose your progress in this cooking session.")
        }
    }

    // MARK: - Top Bar

    private var topBar: some View {
        VStack(spacing: 12) {
            HStack {
                Button {
                    if completedSteps.isEmpty && currentStep == 0 {
                        dismiss()
                    } else {
                        showingExitAlert = true
                    }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(.white.opacity(0.2))
                        .clipShape(Circle())
                }

                Spacer()

                VStack(spacing: 2) {
                    Text(recipe.name)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    if !isSingleBlock {
                        Text("Step \(currentStep + 1) of \(steps.count)")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }

                Spacer()

                // Mirror button for balance
                Color.clear.frame(width: 34, height: 34)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            // Progress bar
            if !isSingleBlock {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule()
                            .fill(.white.opacity(0.2))
                            .frame(height: 4)
                        Capsule()
                            .fill(.white)
                            .frame(width: geo.size.width * progress, height: 4)
                            .animation(.spring(response: 0.4, dampingFraction: 0.8), value: progress)
                    }
                }
                .frame(height: 4)
                .padding(.horizontal, 20)
            }
        }
        .padding(.bottom, 16)
    }

    // MARK: - Step Content (numbered steps)

    private var stepContent: some View {
        VStack(spacing: 32) {
            // Step number badge
            ZStack {
                Circle()
                    .fill(.white.opacity(0.15))
                    .frame(width: 64, height: 64)
                Circle()
                    .strokeBorder(.white.opacity(0.4), lineWidth: 2)
                    .frame(width: 64, height: 64)
                Text("\(currentStep + 1)")
                    .font(.system(size: 28, weight: .black, design: .rounded))
                    .foregroundStyle(.white)
            }

            // Step text
            ScrollView {
                Text(steps[currentStep])
                    .font(.system(size: 22, weight: .medium))
                    .foregroundStyle(.white)
                    .lineSpacing(6)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 28)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxHeight: 300)

            // Completed chip
            if completedSteps.contains(currentStep) {
                HStack(spacing: 6) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 14))
                    Text("Done")
                        .font(.system(size: 14, weight: .semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(.white.opacity(0.2))
                .clipShape(Capsule())
            }
        }
        .id(currentStep) // force animation reset on step change
        .transition(.asymmetric(
            insertion: .move(edge: .trailing).combined(with: .opacity),
            removal:   .move(edge: .leading).combined(with: .opacity)
        ))
    }

    // MARK: - Single Block Content

    private var singleBlockContent: some View {
        ScrollView {
            Text(recipe.instructions.trimmingCharacters(in: .whitespacesAndNewlines))
                .font(.system(size: 20, weight: .medium))
                .foregroundStyle(.white)
                .lineSpacing(6)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 28)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Bottom Navigation

    private var bottomNav: some View {
        VStack(spacing: 16) {
            if currentStep == steps.count - 1 {
                // Last step — finish button
                Button {
                    completedSteps.insert(currentStep)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                        dismiss()
                    }
                } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "flag.fill")
                            .font(.system(size: 15, weight: .semibold))
                        Text("Finish Cooking")
                            .font(.system(size: 17, weight: .bold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 18)
                    .background(.white.opacity(0.25))
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(.white.opacity(0.5), lineWidth: 1.5)
                    )
                }
                .padding(.horizontal, 24)
            } else {
                // Step nav row
                HStack(spacing: 16) {
                    // Previous
                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            if currentStep > 0 { currentStep -= 1 }
                        }
                    } label: {
                        Image(systemName: "chevron.left")
                            .font(.system(size: 17, weight: .semibold))
                            .foregroundStyle(currentStep == 0 ? .white.opacity(0.3) : .white)
                            .frame(width: 52, height: 52)
                            .background(.white.opacity(currentStep == 0 ? 0.08 : 0.2))
                            .clipShape(Circle())
                    }
                    .disabled(currentStep == 0)

                    // Done + Next
                    Button {
                        withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                            completedSteps.insert(currentStep)
                            currentStep += 1
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark")
                                .font(.system(size: 14, weight: .bold))
                            Text("Done, Next Step")
                                .font(.system(size: 16, weight: .bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 17)
                        .background(.white.opacity(0.22))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .strokeBorder(.white.opacity(0.45), lineWidth: 1.5)
                        )
                    }
                }
                .padding(.horizontal, 24)
            }

            // Step dots
            if steps.count > 1 && steps.count <= 12 {
                HStack(spacing: 6) {
                    ForEach(0..<steps.count, id: \.self) { i in
                        Circle()
                            .fill(completedSteps.contains(i)
                                  ? .white
                                  : (i == currentStep ? .white.opacity(0.7) : .white.opacity(0.25)))
                            .frame(width: i == currentStep ? 8 : 6, height: i == currentStep ? 8 : 6)
                            .animation(.spring(response: 0.3), value: currentStep)
                    }
                }
            }
        }
        .padding(.bottom, 40)
    }
}
