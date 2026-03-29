import SwiftUI

struct LeagueHomeView: View {
    let league: League
    @Binding var currentWeek: Int
    @State private var leaderboard: LeaderboardResponse?
    @State private var isLoading = false

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // My stats card
                    if let myRank = league.myRank {
                        HStack(spacing: 20) {
                            VStack(spacing: 4) {
                                Text("P\(myRank)")
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundStyle(myRank <= 3 ? .appGold : .appTextPrimary)
                                Text("Rank").font(.caption).foregroundStyle(.appTextDim)
                            }
                            Divider().background(Color.appBorder)
                            VStack(spacing: 4) {
                                Text("\(league.myTotalPoints ?? 0)")
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundStyle(.appTextPrimary)
                                Text("Points").font(.caption).foregroundStyle(.appTextDim)
                            }
                            Divider().background(Color.appBorder)
                            VStack(spacing: 4) {
                                Text("\(league.memberCount ?? 0)")
                                    .font(.system(size: 36, weight: .bold))
                                    .foregroundStyle(.appTextPrimary)
                                Text("Members").font(.caption).foregroundStyle(.appTextDim)
                            }
                        }
                        .padding(20)
                        .frame(maxWidth: .infinity)
                        .cardStyle(padding: 0)
                        .padding(.horizontal)
                    }

                    // Invite code
                    if let code = league.inviteCode, league.myRole == "commissioner" {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Invite Code").font(.caption).foregroundStyle(.appTextDim)
                                Text(code).font(.headline).fontWeight(.bold)
                                    .foregroundStyle(.appTextPrimary)
                                    .monospaced()
                            }
                            Spacer()
                            Button {
                                UIPasteboard.general.string = code
                            } label: {
                                Label("Copy", systemImage: "doc.on.doc")
                                    .font(.caption).foregroundStyle(.appTextDim)
                            }
                        }
                        .cardStyle()
                        .padding(.horizontal)
                    }

                    // Round info
                    HStack {
                        Text("Round \(currentWeek)")
                            .font(.subheadline).fontWeight(.semibold)
                            .foregroundStyle(.appTextPrimary)
                        Spacer()
                        Text("Season \(league.season)")
                            .font(.caption).foregroundStyle(.appTextDim)
                    }
                    .cardStyle()
                    .padding(.horizontal)

                    Spacer()
                }
                .padding(.top, 16)
            }
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        isLoading = true
        do {
            let response: LeaderboardResponse = try await APIClient.shared.request(
                "GET", path: "/api/leagues/\(league.id)/leaderboard"
            )
            leaderboard = response
            if let round = response.latestRound { currentWeek = round }
        } catch {}
        isLoading = false
    }
}