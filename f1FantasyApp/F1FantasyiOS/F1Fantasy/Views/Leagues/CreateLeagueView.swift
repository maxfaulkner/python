import SwiftUI

struct CreateLeagueView: View {
    var vm: LeaguesViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var leagueType = "classic"
    @State private var isPublic = false
    @State private var isLoading = false
    @State private var errorMessage: String?

    private let types = ["classic", "h2h", "draft", "season_long"]

    var body: some View {
        NavigationStack {
            Form {
                Section("League Details") {
                    TextField("League Name", text: $name)
                    Picker("Format", selection: $leagueType) {
                        ForEach(types, id: \.self) { type in
                            Text(type.replacingOccurrences(of: "_", with: " ").capitalized).tag(type)
                        }
                    }
                    Toggle("Public League", isOn: $isPublic)
                }
                if let err = errorMessage {
                    Section { Text(err).foregroundStyle(.appError).font(.caption) }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.appBackground)
            .navigationTitle("Create League")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            isLoading = true
                            do {
                                _ = try await vm.createLeague(name: name, season: 2026, startingRound: 1,
                                                               type: leagueType, isPublic: isPublic)
                                dismiss()
                            } catch let e as APIError { errorMessage = e.errorDescription }
                            catch { errorMessage = error.localizedDescription }
                            isLoading = false
                        }
                    }
                    .disabled(name.isEmpty || isLoading)
                }
            }
        }
    }
}