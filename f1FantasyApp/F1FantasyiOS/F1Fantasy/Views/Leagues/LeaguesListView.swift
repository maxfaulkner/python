import SwiftUI

struct LeaguesListView: View {
    @State private var vm = LeaguesViewModel()
    @State private var showCreate = false
    @State private var showJoin = false
    @State private var joinCode = ""
    @State private var joinError: String?
    @Environment(AuthService.self) private var authService

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            Group {
                if vm.isLoading && vm.leagues.isEmpty {
                    LoadingView()
                } else if let err = vm.errorMessage {
                    ErrorView(message: err) { Task { await vm.load() } }
                } else if vm.leagues.isEmpty {
                    emptyState
                } else {
                    leaguesList
                }
            }
        }
        .navigationTitle("My Leagues")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Create League", systemImage: "plus") { showCreate = true }
                    Button("Join by Code", systemImage: "person.badge.plus") { showJoin = true }
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $showCreate) {
            CreateLeagueView(vm: vm)
        }
        .sheet(isPresented: $showJoin) { joinSheet }
        .task { await vm.load() }
        .refreshable { await vm.load() }
    }

    private var leaguesList: some View {
        List(vm.leagues) { league in
            NavigationLink(destination: LeagueContainerView(league: league)) {
                LeagueRowView(league: league)
            }
            .listRowBackground(Color.appCard)
            .listRowSeparatorTint(Color.appBorder)
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Text("🏁").font(.system(size: 56))
            Text("No leagues yet").font(.title3).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
            Text("Create a league or join one with an invite code.")
                .font(.subheadline).foregroundStyle(.appTextDim).multilineTextAlignment(.center)
            HStack(spacing: 12) {
                Button("Create") { showCreate = true }
                    .buttonStyle(.borderedProminent).tint(.appRed)
                Button("Join") { showJoin = true }
                    .buttonStyle(.bordered).tint(.appTextDim)
            }
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var joinSheet: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Text("Enter the invite code shared by your league commissioner.")
                    .font(.subheadline).foregroundStyle(.appTextDim).multilineTextAlignment(.center)
                TextField("Invite Code", text: $joinCode)
                    .textInputAutocapitalization(.characters)
                    .autocorrectionDisabled()
                    .padding(14)
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                if let err = joinError {
                    Text(err).font(.caption).foregroundStyle(.appError)
                }
                Button {
                    vm.joinCode = joinCode
                    Task {
                        do {
                            try await vm.joinByCode()
                            showJoin = false
                        } catch let e as APIError { joinError = e.errorDescription }
                        catch { joinError = error.localizedDescription }
                    }
                } label: {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12).fill(Color.appRed).frame(height: 50)
                        if vm.isJoining { ProgressView().tint(.white) }
                        else { Text("Join League").fontWeight(.semibold).foregroundStyle(.white) }
                    }
                }
                .disabled(joinCode.isEmpty || vm.isJoining)
                Spacer()
            }
            .padding(24)
            .background(Color.appBackground.ignoresSafeArea())
            .navigationTitle("Join League")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { showJoin = false } } }
        }
    }
}

struct LeagueRowView: View {
    let league: League

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(league.name)
                        .font(.headline).foregroundStyle(.appTextPrimary)
                    Text(league.leagueType.capitalized)
                        .font(.caption2).fontWeight(.semibold)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Color.appRed.opacity(0.2))
                        .foregroundStyle(.appRed)
                        .clipShape(Capsule())
                }
                Text("\(league.memberCount ?? 0) members · Season \(league.season)")
                    .font(.caption).foregroundStyle(.appTextDim)
            }
            Spacer()
            if let rank = league.myRank {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("P\(rank)")
                        .font(.headline).fontWeight(.bold)
                        .foregroundStyle(rank <= 3 ? .appGold : .appTextPrimary)
                    Text("\(league.myTotalPoints ?? 0) pts")
                        .font(.caption2).foregroundStyle(.appTextDim)
                }
            }
            if league.myRole == "commissioner" {
                Image(systemName: "crown.fill")
                    .font(.caption).foregroundStyle(.appGold)
            }
        }
        .padding(.vertical, 4)
    }
}