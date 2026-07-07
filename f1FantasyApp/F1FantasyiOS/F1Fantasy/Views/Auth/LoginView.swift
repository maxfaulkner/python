import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var authService
    @State private var vm: AuthViewModel?
    @State private var showRegister = false
    @State private var biometricError: String?
    @State private var showEnableBiometricsPrompt = false

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer().frame(height: 48)

                    // Header
                    VStack(spacing: 8) {
                        Text("🏎")
                            .font(.system(size: 56))
                        Text("F1 Fantasy")
                            .font(.system(size: 34, weight: .bold))
                            .foregroundStyle(.appTextPrimary)
                        Text("Grid Fantasy League")
                            .font(.subheadline)
                            .foregroundStyle(.appTextDim)
                    }

                    if let vm {
                        VStack(spacing: 16) {
                            // Fields
                            AuthField(placeholder: "Email", text: Binding(get: { vm.email }, set: { vm.email = $0 }),
                                      keyboardType: .emailAddress, error: vm.fieldErrors["email"])
                            AuthSecureField(placeholder: "Password", text: Binding(get: { vm.password }, set: { vm.password = $0 }),
                                            error: vm.fieldErrors["password"])

                            // Error
                            if let err = vm.errorMessage {
                                Text(err)
                                    .font(.caption)
                                    .foregroundStyle(.appError)
                                    .multilineTextAlignment(.center)
                            }
                            if let err = biometricError {
                                Text(err).font(.caption).foregroundStyle(.appError).multilineTextAlignment(.center)
                            }

                            // Sign In
                            Button {
                                biometricError = nil
                                Task {
                                    await vm.login()
                                    if authService.isAuthenticated && !authService.biometricEnabled
                                        && !authService.biometryTypeName.isEmpty {
                                        showEnableBiometricsPrompt = true
                                    }
                                }
                            } label: {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color.appRed)
                                        .frame(height: 50)
                                    if vm.isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Sign In")
                                            .fontWeight(.semibold)
                                            .foregroundStyle(.white)
                                    }
                                }
                            }
                            .disabled(vm.isLoading)

                            // Biometric unlock button (shown when opted-in + token exists)
                            if authService.biometricEnabled && !authService.biometryTypeName.isEmpty
                                && KeychainHelper.shared.loadToken() != nil {
                                Button {
                                    Task {
                                        do { try await authService.tryBiometricUnlock() }
                                        catch { biometricError = "Biometric unlock failed." }
                                    }
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: authService.biometryTypeName == "Face ID"
                                              ? "faceid" : "touchid")
                                        Text("Sign in with \(authService.biometryTypeName)")
                                            .fontWeight(.semibold)
                                    }
                                    .foregroundStyle(.appTextPrimary)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 50)
                                    .background(Color.appCard)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.appBorder))
                                }
                            }

                            // Register
                            Button("Create an account") { showRegister = true }
                                .font(.subheadline)
                                .foregroundStyle(.appTextDim)
                        }
                        .padding(.horizontal, 24)
                    }
                }
            }
        }
        .onAppear {
            if vm == nil { vm = AuthViewModel(authService: authService) }
        }
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
        .alert("Enable \(authService.biometryTypeName)?",
               isPresented: $showEnableBiometricsPrompt) {
            Button("Enable") { authService.biometricEnabled = true }
            Button("Not Now", role: .cancel) {}
        } message: {
            Text("Sign in faster next time using \(authService.biometryTypeName).")
        }
    }
}

// MARK: - Auth field components

struct AuthField: View {
    let placeholder: String
    let text: Binding<String>
    var keyboardType: UIKeyboardType = .default
    var error: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            TextField(placeholder, text: text)
                .keyboardType(keyboardType)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .padding(14)
                .background(Color.appCard)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(error != nil ? Color.appError : Color.appBorder))
                .foregroundStyle(.appTextPrimary)
            if let error {
                Text(error).font(.caption2).foregroundStyle(.appError)
            }
        }
    }
}

struct AuthSecureField: View {
    let placeholder: String
    let text: Binding<String>
    var error: String?
    @State private var isVisible = false

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Group {
                    if isVisible {
                        TextField(placeholder, text: text).autocorrectionDisabled()
                    } else {
                        SecureField(placeholder, text: text)
                    }
                }
                .textInputAutocapitalization(.never)
                Button { isVisible.toggle() } label: {
                    Image(systemName: isVisible ? "eye.slash" : "eye")
                        .foregroundStyle(.appTextDim)
                }
            }
            .padding(14)
            .background(Color.appCard)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(error != nil ? Color.appError : Color.appBorder))
            .foregroundStyle(.appTextPrimary)
            if let error {
                Text(error).font(.caption2).foregroundStyle(.appError)
            }
        }
    }
}