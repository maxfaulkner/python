import SwiftUI

struct ErrorView: View {
    let message: String
    let retryAction: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.largeTitle)
                .foregroundStyle(.appRed)
            Text(message)
                .foregroundStyle(.appTextDim)
                .multilineTextAlignment(.center)
                .font(.subheadline)
            Button("Try Again", action: retryAction)
                .buttonStyle(.borderedProminent)
                .tint(.appRed)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
    }
}