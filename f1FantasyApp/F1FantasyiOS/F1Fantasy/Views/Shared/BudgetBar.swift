import SwiftUI

struct BudgetBar: View {
    let used: Double
    let total: Double

    private var fraction: Double { min(max(used / total, 0), 1.0) }
    private var isOverBudget: Bool { used > total }
    private var remaining: Double { total - used }

    var body: some View {
        VStack(spacing: 6) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color.appCard)
                        .frame(height: 6)
                    Capsule()
                        .fill(isOverBudget ? Color.appError : Color.appRed)
                        .frame(width: geo.size.width * fraction, height: 6)
                        .animation(.easeInOut(duration: 0.2), value: fraction)
                }
            }
            .frame(height: 6)

            HStack {
                Text("\(used.priceString) used")
                    .font(.caption2)
                    .foregroundStyle(.appTextDim)
                Spacer()
                Text(isOverBudget ? "Over budget!" : "\(remaining.priceString) left")
                    .font(.caption2)
                    .foregroundStyle(isOverBudget ? .appError : .appTextDim)
            }
        }
    }
}