import SwiftUI
import Charts

struct StatsView: View {
    let leagueId: String
    let currentWeek: Int
    @State private var vm = StatsViewModel()

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            Group {
                if vm.isLoading { LoadingView() }
                else if let err = vm.errorMessage { ErrorView(message: err) { Task { await vm.load(leagueId: leagueId, week: currentWeek) } } }
                else { content }
            }
        }
        .navigationTitle("Stats")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: TeamHistoryView(leagueId: leagueId, latestWeek: currentWeek)) {
                    Image(systemName: "clock.arrow.circlepath")
                        .foregroundStyle(.appRed)
                }
            }
        }
        .task { await vm.load(leagueId: leagueId, week: currentWeek) }
        .refreshable { await vm.load(leagueId: leagueId, week: currentWeek) }
    }

    private var content: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Tab toggle
                Picker("", selection: $vm.activeTab) {
                    Text("Performance").tag(StatsViewModel.StatsTab.performance)
                    Text("Prices").tag(StatsViewModel.StatsTab.prices)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                if vm.activeTab == .performance {
                    performanceContent
                } else {
                    PriceWatchView(drivers: vm.driverForm, constructors: vm.constructorForm)
                }
            }
            .padding(.top, 16)
        }
    }

    private var performanceContent: some View {
        VStack(spacing: 16) {
            // Summary cards
            if let stats = vm.stats {
                HStack(spacing: 12) {
                    StatCard(title: "Total", value: "\(stats.totalPoints)")
                    StatCard(title: "Avg / Round", value: "\(stats.avgPoints)")
                    StatCard(title: "Rounds", value: "\(stats.roundsPlayed)")
                }
                .padding(.horizontal)

                // Cumulative line chart
                if !stats.rounds.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Season Progress")
                            .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                        Chart(stats.rounds) { round in
                            LineMark(
                                x: .value("Round", round.week),
                                y: .value("Points", round.cumulative)
                            )
                            .foregroundStyle(Color.appRed)
                            .interpolationMethod(.catmullRom)
                            AreaMark(
                                x: .value("Round", round.week),
                                yStart: .value("Base", 0),
                                yEnd: .value("Points", round.cumulative)
                            )
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [Color.appRed.opacity(0.3), .clear],
                                    startPoint: .top, endPoint: .bottom
                                )
                            )
                        }
                        .frame(height: 180)
                        .chartXAxis {
                            AxisMarks(values: .automatic) { _ in
                                AxisValueLabel().foregroundStyle(Color.appTextDim)
                                AxisGridLine().foregroundStyle(Color.appBorder)
                            }
                        }
                        .chartYAxis {
                            AxisMarks { _ in
                                AxisValueLabel().foregroundStyle(Color.appTextDim)
                                AxisGridLine().foregroundStyle(Color.appBorder)
                            }
                        }
                    }
                    .cardStyle()
                    .padding(.horizontal)

                    // Round bars
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Round by Round")
                            .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                        Chart(stats.rounds) { round in
                            BarMark(
                                x: .value("Round", round.week),
                                y: .value("Points", round.points)
                            )
                            .foregroundStyle(round.chipUsed != nil ? Color.appGold : Color.appRed)
                            .annotation(position: .top) {
                                if let chip = round.chipUsed {
                                    Text(chipEmoji(chip)).font(.system(size: 10))
                                }
                            }
                        }
                        .frame(height: 140)
                        .chartXAxis {
                            AxisMarks { _ in
                                AxisValueLabel().foregroundStyle(Color.appTextDim)
                            }
                        }
                        .chartYAxis {
                            AxisMarks { _ in
                                AxisValueLabel().foregroundStyle(Color.appTextDim)
                                AxisGridLine().foregroundStyle(Color.appBorder)
                            }
                        }
                    }
                    .cardStyle()
                    .padding(.horizontal)
                }
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2).fontWeight(.bold).foregroundStyle(.appTextPrimary)
            Text(title)
                .font(.caption2).foregroundStyle(.appTextDim)
        }
        .frame(maxWidth: .infinity)
        .cardStyle()
    }
}