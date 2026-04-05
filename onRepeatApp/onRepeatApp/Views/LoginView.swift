import SwiftUI
import SwiftData

// MARK: - Login Mode

private enum LoginMode: String, CaseIterable {
    case login  = "Log In"
    case signup = "Sign Up"
}

// MARK: - LoginView

struct LoginView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(AuthStore.self) private var authStore

    @State private var mode: LoginMode = .login
    @State private var username = ""
    @State private var displayName = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var errorMessage = ""

    var body: some View {
        ZStack {
            Color.appBg.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 28) {
                    Spacer().frame(height: 40)

                    // App branding
                    VStack(spacing: 10) {
                        Text("🍽")
                            .font(.system(size: 60))
                        Text("onRepeat")
                            .font(.system(size: 34, weight: .black, design: .rounded))
                            .foregroundStyle(Color.textPrimary)
                        Text("Your recipes, on repeat.")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.textTertiary)
                    }

                    // Mode picker
                    Picker("", selection: $mode) {
                        ForEach(LoginMode.allCases, id: \.self) { m in
                            Text(m.rawValue).tag(m)
                        }
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal, 40)
                    .onChange(of: mode) { errorMessage = "" }

                    // Form
                    VStack(spacing: 0) {
                        formField("USERNAME", text: $username, placeholder: "e.g. mario", isSecure: false)

                        if mode == .signup {
                            Divider()
                            formField("DISPLAY NAME", text: $displayName, placeholder: "e.g. Mario Rossi", isSecure: false)
                        }

                        Divider()
                        formField("PASSWORD", text: $password, placeholder: "Enter password", isSecure: true)

                        if mode == .signup {
                            Divider()
                            formField("CONFIRM PASSWORD", text: $confirmPassword, placeholder: "Confirm password", isSecure: true)
                        }
                    }
                    .cardSurface()
                    .padding(.horizontal, 20)

                    // Error
                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(.red)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 20)
                    }

                    // Submit button
                    Button(action: submit) {
                        Text(mode == .login ? "Log In" : "Create Account")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(colors: [Color.brandGreen, Color.brandMid],
                                               startPoint: .leading, endPoint: .trailing)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: Color.brandGreen.opacity(0.35), radius: 10, x: 0, y: 4)
                    }
                    .padding(.horizontal, 20)
                    .disabled(username.trimmingCharacters(in: .whitespaces).isEmpty ||
                              password.isEmpty)

                    // Seed hint
                    VStack(spacing: 4) {
                        Text("Demo accounts")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.textTertiary)
                        Text("Username & password are the same: mario, priya, chen, sofia, jean, yuki, fatima, james, nana, emma")
                            .font(.system(size: 12))
                            .foregroundStyle(Color.textDisabled)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.horizontal, 32)

                    Spacer(minLength: 40)
                }
            }
        }
        .onAppear {
            UserSeedData.seedIfNeeded(context: modelContext)
        }
    }

    // MARK: - Form Field

    private func formField(_ label: String, text: Binding<String>, placeholder: String, isSecure: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Color.textTertiary)
                .textCase(.uppercase)
            if isSecure {
                SecureField(placeholder, text: text)
                    .font(.system(size: 17))
                    .foregroundStyle(Color.textPrimary)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            } else {
                TextField(placeholder, text: text)
                    .font(.system(size: 17))
                    .foregroundStyle(Color.textPrimary)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
            }
        }
        .padding(16)
    }

    // MARK: - Submit

    private func submit() {
        errorMessage = ""
        let trimmedUsername = username.trimmingCharacters(in: .whitespaces).lowercased()
        guard !trimmedUsername.isEmpty else {
            errorMessage = "Please enter a username."
            return
        }
        guard !password.isEmpty else {
            errorMessage = "Please enter a password."
            return
        }

        let hash = AuthStore.hashPassword(password)

        if mode == .login {
            login(username: trimmedUsername, hash: hash)
        } else {
            signup(username: trimmedUsername, hash: hash)
        }
    }

    private func login(username: String, hash: String) {
        let descriptor = FetchDescriptor<User>(predicate: #Predicate { $0.username == username })
        guard let user = (try? modelContext.fetch(descriptor))?.first else {
            errorMessage = "No account found for \"\(username)\"."
            return
        }
        guard user.passwordHash == hash else {
            errorMessage = "Incorrect password."
            return
        }
        authStore.login(user: user)
    }

    private func signup(username: String, hash: String) {
        let trimmedDisplay = displayName.trimmingCharacters(in: .whitespaces)
        guard !trimmedDisplay.isEmpty else {
            errorMessage = "Please enter a display name."
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords don't match."
            return
        }
        guard password.count >= 3 else {
            errorMessage = "Password must be at least 3 characters."
            return
        }

        // Check if username taken
        let descriptor = FetchDescriptor<User>(predicate: #Predicate { $0.username == username })
        if let existing = try? modelContext.fetch(descriptor), !existing.isEmpty {
            errorMessage = "Username \"\(username)\" is already taken."
            return
        }

        let user = User(username: username, displayName: trimmedDisplay, passwordHash: hash)
        modelContext.insert(user)
        try? modelContext.save()
        authStore.login(user: user)
    }
}
