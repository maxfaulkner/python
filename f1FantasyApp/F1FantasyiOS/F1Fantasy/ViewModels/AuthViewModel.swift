import Foundation
import Observation

@Observable
final class AuthViewModel {
    var email = ""
    var password = ""
    var name = ""
    var isLoading = false
    var errorMessage: String?
    var fieldErrors: [String: String] = [:]

    private let authService: AuthService

    init(authService: AuthService) {
        self.authService = authService
    }

    func login() async {
        guard validateLogin() else { return }
        isLoading = true
        errorMessage = nil
        do {
            try await authService.login(email: email, password: password)
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func register() async {
        guard validateRegister() else { return }
        isLoading = true
        errorMessage = nil
        do {
            try await authService.register(email: email, name: name, password: password)
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func validateLogin() -> Bool {
        fieldErrors = [:]
        if email.trimmingCharacters(in: .whitespaces).isEmpty { fieldErrors["email"] = "Required" }
        if password.isEmpty { fieldErrors["password"] = "Required" }
        return fieldErrors.isEmpty
    }

    private func validateRegister() -> Bool {
        fieldErrors = [:]
        if name.trimmingCharacters(in: .whitespaces).isEmpty { fieldErrors["name"] = "Required" }
        if email.trimmingCharacters(in: .whitespaces).isEmpty { fieldErrors["email"] = "Required" }
        if password.count < 6 { fieldErrors["password"] = "Min 6 characters" }
        return fieldErrors.isEmpty
    }
}