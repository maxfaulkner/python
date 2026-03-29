import SwiftUI

struct RegisterView: View {
    @Environment(AuthService.self) private var authService
    @State private var vm: AuthViewModel?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    Spacer().frame(height: 32)

                    Text("Create Account")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.appTextPrimary)

                    if let vm {
                        VStack(spacing: 16) {
                            AuthField(placeholder: "Name", text: Binding(get: { vm.name }, set: { vm.name = $0 }),
                                      error: vm.fieldErrors["name"])
                            AuthField(placeholder: "Email", text: Binding(get: { vm.email }, set: { vm.email = $0 }),
                                      keyboardType: .emailAddress, error: vm.fieldErrors["email"])
                            AuthSecureField(placeholder: "Password (min 6 chars)",
                                            text: Binding(get: { vm.password }, set: { vm.password = $0 }),
                                            error: vm.fieldErrors["password"])

                            if let err = vm.errorMessage {
                                Text(err).font(.caption).foregroundStyle(.appError).multilineTextAlignment(.center)
                            }

                            Button {
                                Task { await vm.register() }
                            } label: {
                                ZStack {
                                    RoundedRectangle(cornerRadius: 12).fill(Color.appRed).frame(height: 50)
                                    if vm.isLoading {
                                        ProgressView().tint(.white)
                                    } else {
                                        Text("Create Account").fontWeight(.semibold).foregroundStyle(.white)
                                    }
                                }
                            }
                            .disabled(vm.isLoading)

                            Button("Already have an account? Sign in") { dismiss() }
                                .font(.subheadline)
                                .foregroundStyle(.appTextDim)
                        }
                        .padding(.horizontal, 24)
                    }
                }
            }
        }
        .onAppear { if vm == nil { vm = AuthViewModel(authService: authService) } }
        .navigationBarTitleDisplayMode(.inline)
    }
}