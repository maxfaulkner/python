import SwiftUI

struct LoginView: View {
    @Environment(AuthService.self) private var authService
    @State private var vm: AuthViewModel?
    @State private var showRegister = false

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

                            // Sign In
                            Button {
                                Task { await vm.login() }
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