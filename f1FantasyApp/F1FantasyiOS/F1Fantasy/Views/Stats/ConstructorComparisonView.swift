import SwiftUI
import Charts

struct ConstructorComparisonView: View {
    let constructors: [ConstructorPriceEntry]

    @State private var leftId: String = ""
    @State private var rightId: String = ""

    private var leftEntry: ConstructorPriceEntry? { constructors.first(where: { $0.constructorId == leftId }) }
    private var rightEntry: ConstructorPriceEntry? { constructors.first(where: { $0.constructorId == rightId }) }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // Pickers
                    HStack(spacing: 12) {
                        constructorPicker(selection: $leftId, excluded: rightId, label: "Constructor A")
                        Image(systemName: "arrow.left.arrow.right")
                            .foregroundStyle(.appTextDim)
                        constructorPicker(selection: $rightId, excluded: leftId, label: "Constructor B")
                    }
                    .padding(.horizontal)

                    if let left = leftEntry, let right = rightEntry {
                        // Header cards
                        HStack(spacing: 12) {
                            constructorHeader(left)
                            constructorHeader(right)
                        }
                        .padding(.horizontal)

                        // Price comparison
                        comparisonCard(
                            title: "Current Price",
                            leftValue: left.price.priceString,
                            rightValue: right.price.priceString,
                            leftWins: left.price > right.price
                        )

                        // Price delta
                        let leftDelta = priceDelta(for: left)
                        let rightDelta = priceDelta(for: right)
                        comparisonCard(
                            title: "Price Change (last round)",
                            leftValue: deltaSuffix(leftDelta),
                            rightValue: deltaSuffix(rightDelta),
                            leftWins: leftDelta > rightDelta
                        )

                        // Price history chart
                        if (left.priceHistory?.count ?? 0) > 1 || (right.priceHistory?.count ?? 0) > 1 {
                            priceHistoryChart(left: left, right: right)
                        }
                    } else {
                        Text("Select two constructors to compare")
                            .font(.subheadline).foregroundStyle(.appTextDim)
                            .frame(maxWidth: .infinity, minHeight: 120)
                            .multilineTextAlignment(.center)
                            .padding()
                    }
                }
                .padding(.top, 16).padding(.bottom, 32)
            }
        }
        .navigationTitle("Compare Constructors")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if leftId.isEmpty, let first = constructors.first { leftId = first.constructorId }
            if rightId.isEmpty, let second = constructors.dropFirst().first { rightId = second.constructorId }
        }
    }

    // MARK: - Sub-views

    private func constructorPicker(selection: Binding<String>, excluded: String, label: String) -> some View {
        Menu {
            ForEach(constructors.filter { $0.constructorId != excluded }) { entry in
                Button(entry.constructor?.name ?? entry.constructorId) {
                    selection.wrappedValue = entry.constructorId
                }
            }
        } label: {
            HStack {
                let name = constructors.first(where: { $0.constructorId == selection.wrappedValue })?.constructor?.name ?? label
                RoundedRectangle(cornerRadius: 2)
                    .fill(constructorColor(for: name))
                    .frame(width: 3, height: 16)
                Text(name)
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                    .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.down").font(.caption2).foregroundStyle(.appTextDim)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(Color.appCard)
            .clipShape(RoundedRectangle(cornerRadius: 10))
        }
        .frame(maxWidth: .infinity)
    }

    private func constructorHeader(_ entry: ConstructorPriceEntry) -> some View {
        VStack(spacing: 6) {
            let name = entry.constructor?.name ?? entry.constructorId
            RoundedRectangle(cornerRadius: 4)
                .fill(constructorColor(for: name))
                .frame(height: 4)
            Text(name)
                .font(.subheadline).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                .lineLimit(1)
            Text(entry.constructor?.nationality ?? "")
                .font(.caption2).foregroundStyle(.appTextDim)
        }
        .frame(maxWidth: .infinity)
        .padding(12)
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func comparisonCard(title: String, leftValue: String, rightValue: String, leftWins: Bool) -> some View {
        VStack(spacing: 8) {
            Text(title)
                .font(.caption).foregroundStyle(.appTextDim)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16).padding(.top, 12)
            HStack {
                Text(leftValue)
                    .font(.title3).fontWeight(.bold)
                    .foregroundStyle(leftWins ? .appSuccess : .appTextPrimary)
                    .frame(maxWidth: .infinity)
                Text("vs")
                    .font(.caption).foregroundStyle(.appTextFaint)
                Text(rightValue)
                    .font(.title3).fontWeight(.bold)
                    .foregroundStyle(!leftWins ? .appSuccess : .appTextPrimary)
                    .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 16).padding(.bottom, 12)
        }
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func priceHistoryChart(left: ConstructorPriceEntry, right: ConstructorPriceEntry) -> some View {
        let leftHistory = left.priceHistory ?? [left.price]
        let rightHistory = right.priceHistory ?? [right.price]
        let leftName = left.constructor?.name ?? "A"
        let rightName = right.constructor?.name ?? "B"
        let leftColor = constructorColor(for: leftName)
        let rightColor = constructorColor(for: rightName)

        struct Point: Identifiable {
            let id = UUID()
            let week: Int; let price: Double; let label: String
        }
        var points: [Point] = []
        for (i, p) in leftHistory.enumerated() { points.append(.init(week: i + 1, price: p, label: leftName)) }
        for (i, p) in rightHistory.enumerated() { points.append(.init(week: i + 1, price: p, label: rightName)) }

        return VStack(alignment: .leading, spacing: 8) {
            Text("Price History")
                .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                .padding(.horizontal, 16).padding(.top, 12)
            Chart(points) { pt in
                LineMark(x: .value("Week", pt.week), y: .value("Price", pt.price))
                    .foregroundStyle(pt.label == leftName ? leftColor : rightColor)
                    .interpolationMethod(.catmullRom)
            }
            .chartForegroundStyleScale([leftName: leftColor, rightName: rightColor])
            .chartLegend(.visible)
            .frame(height: 160)
            .padding(.horizontal, 16).padding(.bottom, 12)
            .chartXAxis {
                AxisMarks { _ in AxisValueLabel().foregroundStyle(Color.appTextDim); AxisGridLine().foregroundStyle(Color.appBorder) }
            }
            .chartYAxis {
                AxisMarks { _ in AxisValueLabel().foregroundStyle(Color.appTextDim); AxisGridLine().foregroundStyle(Color.appBorder) }
            }
        }
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func priceDelta(for entry: ConstructorPriceEntry) -> Double {
        guard let history = entry.priceHistory, history.count >= 2 else { return 0 }
        return entry.price - history[history.count - 2]
    }

    private func deltaSuffix(_ delta: Double) -> String {
        if delta == 0 { return "—" }
        return (delta > 0 ? "+" : "") + delta.priceString
    }
}
