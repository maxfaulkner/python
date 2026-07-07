import SwiftUI

struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .tint(.appRed)
                .scaleEffect(1.4)
            Text("Loading...")
                .foregroundStyle(.appTextDim)
                .font(.caption)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.appBackground)
    }
}