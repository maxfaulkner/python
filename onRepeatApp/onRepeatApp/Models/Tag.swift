import Foundation
import SwiftData

@Model
class Tag {
    var id: UUID
    var name: String
    var recipes: [Recipe] = []

    init(name: String) {
        self.id = UUID()
        self.name = name.lowercased().trimmingCharacters(in: .whitespaces)
    }
}
