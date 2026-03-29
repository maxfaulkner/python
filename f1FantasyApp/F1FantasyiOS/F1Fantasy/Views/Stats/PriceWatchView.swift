import SwiftUI
import Charts

struct PriceWatchView: View {
    let drivers: [DriverPriceEntry]
    let constructors: [ConstructorPriceEntry]
    @State private var activeTab = 0

    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $activeTab) {
                Text("Drivers").tag(0)
                Text("Constructors").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal).padding(.bottom, 8)

            if activeTab == 0 {
                ForEach(drivers.sorted(by: { $0.price > $1.price })) { entry in
                    PriceRow(
                        name: entry.driver?.name ?? "Unknown",
                        team: entry.driver?.constructor?.name ?? "",
                        price: entry.price,
                        priceHistory: entry.priceHistory ?? [],
                        teamColor: constructorColor(for: entry.driver?.constructor?.name)
                    )
                    .padding(.horizontal)
                    .padding(.vertical, 4)
                }
            } else {
                if constructors.count >= 2 {
                    NavigationLink(destination: ConstructorComparisonView(constructors: constructors)) {
                        Label("Compare Constructors", systemImage: "arrow.left.arrow.right")
                            .font(.subheadline).fontWeight(.semibold)
                            .foregroundStyle(.appRed)
                            .frame(maxWidth: .infinity)
                            .padding(12)
                            .background(Color.appCard)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.appRed.opacity(0.3), lineWidth: 1))
                    }
                    .padding(.horizontal)
                    .padding(.top, 4)
                }
                ForEach(constructors.sorted(by: { $0.price > $1.price })) { entry in
                    PriceRow(
                        name: entry.constructor?.name ?? "Unknown",
                        team: entry.constructor?.nationality ?? "",
                        price: entry.price,
                        priceHistory: entry.priceHistory ?? [],
                        teamColor: constructorColor(for: entry.constructor?.name)
                    )
                    .padding(.horizontal)
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

struct PriceRow: View {
    let name: String
    let team: String
    let price: Double
    let priceHistory: [Double]
    let teamColor: Color

    private var priceDelta: Double {
        guard priceHistory.count >= 2 else { return 0 }
        return price - priceHistory[priceHistory.count - 2]
    }

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(teamColor)
                .frame(width: 3, height: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                Text(team).font(.caption2).foregroundStyle(.appTextDim)
            }

            Spacer()

            // Sparkline
            if priceHistory.count > 1 {
                Chart(Array(priceHistory.enumerated()), id: \.offset) { i, val in
                    LineMark(x: .value("Week", i), y: .value("Price", val))
                        .foregroundStyle(priceDelta >= 0 ? Color.appError : Color.appSuccess)
                }
                .frame(width: 50, height: 30)
                .chartXAxis(.hidden)
                .chartYAxis(.hidden)
            }

            VStack(alignment: .trailing, spacing: 2) {
                Text(price.priceString).font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                if priceDelta != 0 {
                    HStack(spacing: 2) {
                        Image(systemName: priceDelta > 0 ? "arrow.up" : "arrow.down")
                            .font(.caption2)
                        Text(abs(priceDelta).priceString).font(.caption2)
                    }
                    .foregroundStyle(priceDelta > 0 ? Color.appError : Color.appSuccess)
                }
            }
        }
        .padding(12)
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}