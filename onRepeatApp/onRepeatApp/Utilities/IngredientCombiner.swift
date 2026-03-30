import Foundation

// MARK: - Grocery Category

enum GroceryCategory: String, CaseIterable, Comparable {
    case produce    = "Produce"
    case dairy      = "Dairy & Eggs"
    case meat       = "Meat & Seafood"
    case bakery     = "Bakery"
    case grains     = "Grains & Pasta"
    case canned     = "Canned & Jarred"
    case spices     = "Spices & Herbs"
    case condiments = "Condiments & Oils"
    case beverages  = "Beverages"
    case frozen     = "Frozen"
    case other      = "Other"

    private static let order = allCases
    static func < (lhs: Self, rhs: Self) -> Bool {
        (order.firstIndex(of: lhs) ?? 0) < (order.firstIndex(of: rhs) ?? 0)
    }

    static func categorize(_ name: String) -> GroceryCategory {
        let n = name.lowercased()
        func matches(_ words: [String]) -> Bool { words.contains { n.contains($0) } }

        if matches(["apple","banana","orange","lemon","lime","grape","berry","strawberry","blueberry","raspberry","cherry","peach","plum","pear","mango","pineapple","melon","avocado","tomato","potato","sweet potato","onion","garlic","shallot","leek","carrot","celery","broccoli","cauliflower","cabbage","kale","spinach","lettuce","arugula","chard","mushroom","zucchini","cucumber","pepper","eggplant","corn","asparagus","artichoke","beet","radish","squash","pumpkin","ginger","scallion","jalapeño","bok choy","fennel","parsley","cilantro","basil","mint","dill","chive","thyme","rosemary","sage","tarragon"]) { return .produce }

        if matches(["milk","cream","butter","cheese","parmesan","mozzarella","cheddar","ricotta","feta","gouda","brie","gruyere","pecorino","colby","yogurt","sour cream","cream cheese","half and half","egg","buttermilk","ghee","whipping","heavy cream","mascarpone"]) { return .dairy }

        if matches(["chicken","beef","pork","lamb","turkey","duck","veal","sausage","bacon","ham","salami","pepperoni","ground","steak","brisket","rib","loin","breast","thigh","wing","drumstick","salmon","tuna","shrimp","scallop","cod","tilapia","halibut","mahi","crab","lobster","clam","oyster","mussel","anchovy","sardine","prosciutto","pancetta","chorizo","guanciale"]) { return .meat }

        if matches(["bread","baguette","roll","bun","pita","tortilla","naan","croissant","muffin","bagel","english muffin","sourdough","brioche","flatbread","crouton"]) { return .bakery }

        if matches(["pasta","spaghetti","penne","rigatoni","fettuccine","linguine","rice","quinoa","couscous","oat","flour","cornmeal","polenta","barley","lentil","noodle","ramen","orzo","farro","bulgur","chickpea","breadcrumb","panko","semolina","arborio"]) { return .grains }

        if matches(["canned","crushed tomato","tomato paste","tomato sauce","diced tomato","coconut milk","broth","stock","kidney bean","black bean","cannellini","navy bean","chickpea","white bean","artichoke heart","roasted pepper","capers","anchovy paste","olive","sun-dried"]) { return .canned }

        if matches(["salt","pepper","cumin","coriander","turmeric","paprika","cayenne","chili powder","oregano","bay leaf","cinnamon","nutmeg","cardamom","allspice","star anise","fennel seed","caraway","mustard seed","red pepper flake","smoked paprika","garlic powder","onion powder","curry powder","garam masala","za'atar","sumac","dried","seasoning","spice"]) { return .spices }

        if matches(["oil","olive oil","vegetable oil","coconut oil","sesame oil","avocado oil","canola","vinegar","soy sauce","worcestershire","hot sauce","ketchup","mustard","mayonnaise","tahini","miso","fish sauce","oyster sauce","hoisin","honey","maple syrup","sugar","brown sugar","powdered sugar","molasses","corn syrup","vanilla","extract","sriracha","pesto"]) { return .condiments }

        if matches(["wine","beer","juice","coffee","tea","sparkling water","soda","stock","broth"]) { return .beverages }

        if matches(["frozen","ice cream","sorbet","edamame"]) { return .frozen }

        return .other
    }
}

// MARK: - Combined Ingredient

struct CombinedIngredient: Identifiable {
    let id = UUID()
    let quantity: Double
    let unit: String
    let name: String
    let category: GroceryCategory

    var formattedQuantity: String {
        if quantity.truncatingRemainder(dividingBy: 1) == 0 { return String(Int(quantity)) }
        let s = String(format: "%.2f", quantity)
        // Remove trailing zeros after decimal point
        var result = s
        while result.hasSuffix("0") { result.removeLast() }
        if result.hasSuffix(".") { result.removeLast() }
        return result
    }
}

// MARK: - Combiner

enum IngredientCombiner {
    private static let unitAliases: [String: String] = [
        "cup":"cup","cups":"cup",
        "tablespoon":"tbsp","tablespoons":"tbsp","tbsp":"tbsp","tbs":"tbsp",
        "teaspoon":"tsp","teaspoons":"tsp","tsp":"tsp",
        "ounce":"oz","ounces":"oz","oz":"oz",
        "pound":"lb","pounds":"lb","lb":"lb","lbs":"lb",
        "gram":"g","grams":"g","g":"g",
        "kilogram":"kg","kilograms":"kg","kg":"kg",
        "milliliter":"ml","milliliters":"ml","ml":"ml",
        "liter":"l","liters":"l","l":"l",
        "clove":"clove","cloves":"clove",
        "can":"can","cans":"can",
        "pinch":"pinch","pinches":"pinch",
        "bunch":"bunch","bunches":"bunch",
        "slice":"slice","slices":"slice",
        "piece":"piece","pieces":"piece",
    ]

    static func normalizeUnit(_ unit: String) -> String {
        let lower = unit.lowercased().trimmingCharacters(in: .whitespaces)
        return unitAliases[lower] ?? lower
    }

    static func combine(_ selections: [(recipe: Recipe, targetServings: Double)]) -> [CombinedIngredient] {
        var totals: [String: Double] = [:]
        var meta: [String: (unit: String, name: String, category: GroceryCategory)] = [:]

        for (recipe, targetServings) in selections {
            guard recipe.servings > 0 else { continue }
            let scale = targetServings / recipe.servings
            for ingredient in recipe.ingredients {
                let unit = normalizeUnit(ingredient.unit)
                let name = ingredient.name.lowercased().trimmingCharacters(in: .whitespaces)
                let key = "\(unit)|\(name)"
                totals[key, default: 0] += ingredient.quantity * scale
                if meta[key] == nil {
                    meta[key] = (unit: unit, name: name, category: GroceryCategory.categorize(name))
                }
            }
        }

        return totals.compactMap { key, qty in
            guard let m = meta[key] else { return nil }
            return CombinedIngredient(quantity: qty, unit: m.unit, name: m.name, category: m.category)
        }
        .sorted {
            if $0.category != $1.category { return $0.category < $1.category }
            if $0.unit != $1.unit { return $0.unit < $1.unit }
            return $0.name < $1.name
        }
    }
}
