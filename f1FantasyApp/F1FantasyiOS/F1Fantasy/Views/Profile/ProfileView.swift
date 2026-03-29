import SwiftUI

struct ProfileView: View {
    @Environment(AuthService.self) private var authService
    @State private var isEditing = false
    @State private var editName = ""
    @State private var editBio = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let avatarColors = ["e10600", "f59e0b", "22c55e", "3671C6", "FF8000", "27F4D2", "229971", "FF87BC"]

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 24) {
                    // Avatar
                    if let user = authService.currentUser {
                        AvatarView(name: user.name, colorHex: user.resolvedAvatarColor, size: 80)
                            .padding(.top, 24)

                        if isEditing {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    ForEach(avatarColors, id: \.self) { color in
                                        Circle().fill(Color(hex: color))
                                            .frame(width: 32, height: 32)
                                            .overlay(Circle().stroke(user.resolvedAvatarColor == color ? Color.white : Color.clear, lineWidth: 2))
                                            .onTapGesture { Task { await updateProfile(avatarColor: color) } }
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }

                        if isEditing {
                            VStack(spacing: 12) {
                                TextField("Name", text: $editName)
                                    .padding(12).background(Color.appCard)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .foregroundStyle(.appTextPrimary)
                                TextField("Bio", text: $editBio, axis: .vertical)
                                    .lineLimit(3)
                                    .padding(12).background(Color.appCard)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                    .foregroundStyle(.appTextPrimary)
                                if let err = errorMessage {
                                    Text(err).font(.caption).foregroundStyle(.appError)
                                }
                                Button {
                                    Task { await saveProfile() }
                                } label: {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 10).fill(Color.appRed).frame(height: 44)
                                        if isSaving { ProgressView().tint(.white) }
                                        else { Text("Save").fontWeight(.semibold).foregroundStyle(.white) }
                                    }
                                }
                            }
                            .padding(.horizontal, 24)
                        } else {
                            VStack(spacing: 4) {
                                Text(user.name)
                                    .font(.title2).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                                Text(user.email).font(.subheadline).foregroundStyle(.appTextDim)
                                if let bio = user.bio, !bio.isEmpty {
                                    Text(bio).font(.subheadline).foregroundStyle(.appTextDim)
                                        .multilineTextAlignment(.center)
                                        .padding(.horizontal, 32)
                                }
                            }
                        }
                    }

                    // Sign out
                    Button("Sign Out") { authService.logout() }
                        .font(.subheadline).foregroundStyle(.appError)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .navigationTitle("Profile")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button(isEditing ? "Done" : "Edit") {
                    if !isEditing {
                        editName = authService.currentUser?.name ?? ""
                        editBio = authService.currentUser?.bio ?? ""
                    }
                    isEditing.toggle()
                }
            }
        }
    }

    private func saveProfile() async {
        isSaving = true
        do {
            let _: User = try await APIClient.shared.request(
                "PUT", path: "/api/profile",
                body: UpdateProfileRequest(name: editName, bio: editBio, avatarColor: nil)
            )
            isEditing = false
        } catch let e as APIError { errorMessage = e.errorDescription }
        catch { errorMessage = error.localizedDescription }
        isSaving = false
    }

    private func updateProfile(avatarColor: String) async {
        let _: User? = try? await APIClient.shared.request(
            "PUT", path: "/api/profile",
            body: UpdateProfileRequest(name: nil, bio: nil, avatarColor: avatarColor)
        )
    }
}