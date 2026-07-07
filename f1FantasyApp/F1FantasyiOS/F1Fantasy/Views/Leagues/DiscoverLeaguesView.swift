import SwiftUI

struct DiscoverLeaguesView: View {
    @State private var leagues: [League] = []
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var joinError: String?
    @State private var joiningId: String?

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            Group {
                if isLoading && leagues.isEmpty { LoadingView() }
                else if let err = errorMessage { ErrorView(message: err) { Task { await load() } } }
                else if leagues.isEmpty {
                    VStack(spacing: 12) {
                        Text("🔍").font(.system(size: 48))
                        Text("No public leagues found").foregroundStyle(.appTextDim)
                    }.frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    List(leagues) { league in
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(league.name).font(.headline).foregroundStyle(.appTextPrimary)
                                Text("\(league.memberCount ?? 0) / \(league.maxPlayers) members · \(league.leagueType.capitalized)")
                                    .font(.caption).foregroundStyle(.appTextDim)
                            }
                            Spacer()
                            Button("Join") {
                                Task { await join(league: league) }
                            }
                            .buttonStyle(.borderedProminent).tint(.appRed)
                            .disabled(joiningId == league.id)
                        }
                        .listRowBackground(Color.appCard)
                    }
                    .listStyle(.insetGrouped)
                    .scrollContentBackground(.hidden)
                }
            }
        }
        .navigationTitle("Discover")
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        isLoading = true
        do {
            let response: [League] = try await APIClient.shared.request("GET", path: "/api/leagues/public")
            leagues = response
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isLoading = false
    }

    private func join(league: League) async {
        joiningId = league.id
        do {
            let _: JoinLeagueResponse = try await APIClient.shared.request(
                "POST", path: "/api/leagues/\(league.id)/join"
            )
            leagues.removeAll { $0.id == league.id }
        } catch let e as APIError { joinError = e.errorDescription }
        catch {}
        joiningId = nil
    }
}