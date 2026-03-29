import SwiftUI

struct RankDeltaBadge: View {
    let delta: Int

    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: delta > 0 ? "arrow.up" : delta < 0 ? "arrow.down" : "minus")
            if delta != 0 {
                Text("\(abs(delta))")
                    .font(.caption2)
            }
        }
        .foregroundStyle(delta > 0 ? Color.appSuccess : delta < 0 ? Color.appError : Color.appTextFaint)
        .font(.caption)
    }
}