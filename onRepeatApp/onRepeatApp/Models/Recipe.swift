import Foundation
import SwiftData

@Model
class Recipe {
    var id: UUID
    var name: String
    var servings: Double
    var instructions: String
    var createdAt: Date

    @Relationship(deleteRule: .cascade)
    var ingredients: [Ingredient] = []

    var tags: [Tag] = []

    init(name: String, servings: Double = 4.0, instructions: String = "") {
        self.id = UUID()
        self.name = name
        self.servings = servings
        self.instructions = instructions
        self.createdAt = Date()
    }
}
