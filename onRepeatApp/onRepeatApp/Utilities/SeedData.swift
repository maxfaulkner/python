import Foundation
import SwiftData

enum SeedData {

    static func seedIfNeeded(context: ModelContext) {
        let descriptor = FetchDescriptor<Recipe>()
        let count = (try? context.fetchCount(descriptor)) ?? 0
        guard count == 0 else { return }
        seed(context: context)
    }

    // MARK: - Tag cache

    private static var tagCache: [String: Tag] = [:]

    private static func tag(_ name: String, context: ModelContext) -> Tag {
        if let existing = tagCache[name] { return existing }
        let t = Tag(name: name)
        context.insert(t)
        tagCache[name] = t
        return t
    }

    // MARK: - Main seed

    private static func seed(context: ModelContext) {
        tagCache = [:]
        let recipes = buildRecipes(context: context)
        for r in recipes { context.insert(r) }
        try? context.save()
    }

    // MARK: - Recipe builder

    private static func ing(_ qty: Double, _ unit: String, _ name: String) -> Ingredient {
        Ingredient(quantity: qty, unit: unit, name: name)
    }

    private static func buildRecipes(context: ModelContext) -> [Recipe] {
        [

            // ── 1 ─────────────────────────────────────────────────────────────
            make("Spaghetti Bolognese", servings: 4,
                 instructions: """
                 Heat olive oil in a large pan over medium heat.
                 Add onion and garlic, cook until softened, about 5 minutes.
                 Add ground beef and cook until browned, breaking it up as it cooks.
                 Pour in crushed tomatoes, red wine, and tomato paste. Stir well.
                 Season with salt, pepper, oregano, and bay leaves.
                 Simmer on low for 45 minutes, stirring occasionally.
                 Cook spaghetti according to package directions. Drain.
                 Serve sauce over pasta. Top with parmesan.
                 """,
                 tags: ["italian", "pasta", "weeknight"],
                 ingredients: [
                    ing(500, "g", "ground beef"),
                    ing(400, "g", "spaghetti"),
                    ing(1, "can", "crushed tomatoes"),
                    ing(1, "", "onion"),
                    ing(3, "clove", "garlic"),
                    ing(2, "tbsp", "tomato paste"),
                    ing(120, "ml", "red wine"),
                    ing(2, "tbsp", "olive oil"),
                    ing(1, "tsp", "dried oregano"),
                    ing(2, "", "bay leaves"),
                    ing(50, "g", "parmesan"),
                 ], context: context),

            // ── 2 ─────────────────────────────────────────────────────────────
            make("Chicken Tikka Masala", servings: 4,
                 instructions: """
                 Marinate chicken in yogurt, lemon juice, and spices for at least 1 hour.
                 Grill or broil chicken until charred at the edges. Set aside.
                 In a large pan, cook onion until golden. Add garlic and ginger.
                 Stir in tomato puree, heavy cream, and remaining spices.
                 Simmer sauce for 15 minutes until thickened.
                 Add chicken pieces to the sauce and simmer 10 more minutes.
                 Serve with basmati rice and naan. Garnish with cilantro.
                 """,
                 tags: ["indian", "chicken", "spicy"],
                 ingredients: [
                    ing(700, "g", "chicken breast"),
                    ing(200, "ml", "heavy cream"),
                    ing(400, "g", "tomato puree"),
                    ing(1, "", "onion"),
                    ing(4, "clove", "garlic"),
                    ing(1, "tbsp", "fresh ginger"),
                    ing(150, "g", "yogurt"),
                    ing(1, "tbsp", "garam masala"),
                    ing(1, "tsp", "turmeric"),
                    ing(1, "tsp", "cumin"),
                    ing(1, "tsp", "paprika"),
                    ing(2, "tbsp", "butter"),
                    ing(300, "g", "basmati rice"),
                    ing(4, "", "naan"),
                    ing(1, "bunch", "cilantro"),
                 ], context: context),

            // ── 3 ─────────────────────────────────────────────────────────────
            make("Avocado Toast with Poached Eggs", servings: 2,
                 instructions: """
                 Fill a saucepan with water and bring to a gentle simmer. Add a splash of vinegar.
                 Toast the sourdough slices until golden.
                 Halve avocados, remove pits, and scoop into a bowl.
                 Mash with lemon juice, salt, pepper, and red pepper flakes.
                 Crack each egg into a small cup, then slide into the simmering water. Poach 3-4 minutes.
                 Spread avocado generously on toast. Top with a poached egg.
                 Finish with flaky salt, everything bagel seasoning, and a drizzle of olive oil.
                 """,
                 tags: ["breakfast", "vegetarian", "quick"],
                 ingredients: [
                    ing(4, "slice", "sourdough bread"),
                    ing(2, "", "avocado"),
                    ing(4, "", "egg"),
                    ing(1, "tbsp", "lemon juice"),
                    ing(0.5, "tsp", "red pepper flakes"),
                    ing(1, "tbsp", "olive oil"),
                    ing(1, "tsp", "everything bagel seasoning"),
                    ing(1, "pinch", "flaky salt"),
                 ], context: context),

            // ── 4 ─────────────────────────────────────────────────────────────
            make("Beef Tacos", servings: 6,
                 instructions: """
                 Heat oil in a skillet over medium-high heat.
                 Cook onion until soft. Add garlic and cook 1 minute.
                 Add ground beef and brown completely. Drain excess fat.
                 Stir in chili powder, cumin, paprika, salt, and tomato paste.
                 Add a splash of water and simmer 5 minutes.
                 Warm tortillas in a dry pan.
                 Serve beef in tortillas topped with cheese, salsa, sour cream, lettuce, and lime.
                 """,
                 tags: ["mexican", "beef", "weeknight"],
                 ingredients: [
                    ing(500, "g", "ground beef"),
                    ing(12, "", "corn tortilla"),
                    ing(1, "", "onion"),
                    ing(3, "clove", "garlic"),
                    ing(2, "tsp", "chili powder"),
                    ing(1, "tsp", "cumin"),
                    ing(1, "tsp", "paprika"),
                    ing(1, "tbsp", "tomato paste"),
                    ing(100, "g", "cheddar"),
                    ing(150, "ml", "salsa"),
                    ing(100, "ml", "sour cream"),
                    ing(2, "cup", "shredded lettuce"),
                    ing(2, "", "lime"),
                 ], context: context),

            // ── 5 ─────────────────────────────────────────────────────────────
            make("Mushroom Risotto", servings: 4,
                 instructions: """
                 Heat stock in a small saucepan and keep warm over low heat.
                 Sauté onion in butter and olive oil until translucent.
                 Add garlic and mushrooms, cook until mushrooms release liquid.
                 Add arborio rice, stir to coat. Toast 2 minutes.
                 Pour in white wine and stir until absorbed.
                 Add stock one ladle at a time, stirring constantly. Continue 18-20 minutes.
                 Remove from heat. Stir in parmesan and butter. Season generously.
                 Garnish with fresh thyme.
                 """,
                 tags: ["italian", "vegetarian", "comfort food"],
                 ingredients: [
                    ing(300, "g", "arborio rice"),
                    ing(500, "g", "mixed mushrooms"),
                    ing(1, "l", "vegetable stock"),
                    ing(1, "", "onion"),
                    ing(3, "clove", "garlic"),
                    ing(120, "ml", "white wine"),
                    ing(80, "g", "parmesan"),
                    ing(3, "tbsp", "butter"),
                    ing(2, "tbsp", "olive oil"),
                    ing(4, "sprig", "fresh thyme"),
                 ], context: context),

            // ── 6 ─────────────────────────────────────────────────────────────
            make("Greek Salad", servings: 4,
                 instructions: """
                 Chop tomatoes, cucumber, and red onion into large chunks.
                 Halve the kalamata olives.
                 Combine vegetables in a large bowl.
                 Drizzle generously with olive oil and red wine vinegar.
                 Season with oregano, salt, and pepper.
                 Top with large slabs of feta cheese.
                 Serve immediately with crusty bread.
                 """,
                 tags: ["greek", "salad", "vegetarian", "quick"],
                 ingredients: [
                    ing(4, "", "tomato"),
                    ing(1, "", "cucumber"),
                    ing(0.5, "", "red onion"),
                    ing(200, "g", "feta"),
                    ing(100, "g", "kalamata olives"),
                    ing(3, "tbsp", "olive oil"),
                    ing(1, "tbsp", "red wine vinegar"),
                    ing(1, "tsp", "dried oregano"),
                    ing(1, "", "green bell pepper"),
                 ], context: context),

            // ── 7 ─────────────────────────────────────────────────────────────
            make("Banana Pancakes", servings: 2,
                 instructions: """
                 Mash ripe bananas in a bowl until smooth.
                 Whisk in eggs, milk, vanilla, and melted butter.
                 Fold in flour, baking powder, and a pinch of salt.
                 Heat a non-stick pan over medium heat. Lightly butter.
                 Pour batter in small circles. Cook until bubbles form, then flip.
                 Serve stacked with maple syrup, fresh berries, and a dusting of powdered sugar.
                 """,
                 tags: ["breakfast", "sweet", "quick"],
                 ingredients: [
                    ing(2, "", "ripe banana"),
                    ing(2, "", "egg"),
                    ing(120, "ml", "milk"),
                    ing(1, "cup", "flour"),
                    ing(1, "tsp", "baking powder"),
                    ing(1, "tsp", "vanilla"),
                    ing(2, "tbsp", "butter"),
                    ing(3, "tbsp", "maple syrup"),
                    ing(1, "cup", "mixed berries"),
                    ing(1, "tbsp", "powdered sugar"),
                 ], context: context),

            // ── 8 ─────────────────────────────────────────────────────────────
            make("Tom Yum Soup", servings: 4,
                 instructions: """
                 Bring chicken stock to a boil in a large pot.
                 Add lemongrass, galangal, kaffir lime leaves, and chili. Simmer 10 minutes.
                 Add mushrooms and shrimp. Cook until shrimp turns pink.
                 Stir in fish sauce, lime juice, and sugar.
                 Remove lemongrass and galangal before serving.
                 Ladle into bowls and garnish with cilantro and scallions.
                 """,
                 tags: ["thai", "soup", "spicy"],
                 ingredients: [
                    ing(1, "l", "chicken stock"),
                    ing(300, "g", "shrimp"),
                    ing(200, "g", "mushrooms"),
                    ing(2, "stalk", "lemongrass"),
                    ing(3, "slice", "galangal"),
                    ing(4, "", "kaffir lime leaves"),
                    ing(3, "", "red chili"),
                    ing(3, "tbsp", "fish sauce"),
                    ing(2, "tbsp", "lime juice"),
                    ing(1, "tsp", "sugar"),
                    ing(1, "bunch", "cilantro"),
                    ing(3, "", "scallion"),
                 ], context: context),

            // ── 9 ─────────────────────────────────────────────────────────────
            make("Chocolate Lava Cakes", servings: 4,
                 instructions: """
                 Preheat oven to 425°F. Butter four ramekins and dust with cocoa powder.
                 Melt dark chocolate and butter together over a double boiler. Let cool slightly.
                 Whisk eggs, egg yolks, and sugar until pale and thick.
                 Fold chocolate mixture into egg mixture.
                 Sift in flour and fold gently.
                 Divide batter among ramekins. Refrigerate 30 minutes.
                 Bake 12 minutes — edges set, center still jiggly.
                 Let rest 1 minute, then invert onto plates. Serve with vanilla ice cream.
                 """,
                 tags: ["dessert", "chocolate", "dinner party"],
                 ingredients: [
                    ing(200, "g", "dark chocolate"),
                    ing(150, "g", "butter"),
                    ing(4, "", "egg"),
                    ing(2, "", "egg yolk"),
                    ing(120, "g", "sugar"),
                    ing(50, "g", "flour"),
                    ing(2, "tbsp", "cocoa powder"),
                    ing(4, "scoop", "vanilla ice cream"),
                 ], context: context),

            // ── 10 ────────────────────────────────────────────────────────────
            make("Shakshuka", servings: 3,
                 instructions: """
                 Heat olive oil in a large oven-safe skillet over medium heat.
                 Cook onion and bell pepper until soft. Add garlic and cook 1 minute.
                 Stir in cumin, paprika, cayenne, and tomato paste. Cook 2 minutes.
                 Add crushed tomatoes. Season and simmer 10 minutes.
                 Make wells in the sauce and crack eggs into them.
                 Cover and cook until egg whites are set but yolks are runny.
                 Scatter feta and fresh herbs over the top. Serve with crusty bread.
                 """,
                 tags: ["breakfast", "vegetarian", "middle eastern"],
                 ingredients: [
                    ing(6, "", "egg"),
                    ing(1, "can", "crushed tomatoes"),
                    ing(1, "", "onion"),
                    ing(1, "", "red bell pepper"),
                    ing(4, "clove", "garlic"),
                    ing(1, "tsp", "cumin"),
                    ing(1, "tsp", "smoked paprika"),
                    ing(0.25, "tsp", "cayenne"),
                    ing(2, "tbsp", "tomato paste"),
                    ing(80, "g", "feta"),
                    ing(2, "tbsp", "olive oil"),
                    ing(1, "bunch", "parsley"),
                 ], context: context),

            // ── 11 ────────────────────────────────────────────────────────────
            make("Salmon Teriyaki", servings: 2,
                 instructions: """
                 Mix soy sauce, mirin, sake, and sugar in a small saucepan.
                 Simmer until slightly thickened to make teriyaki sauce.
                 Pat salmon fillets dry. Season with salt and pepper.
                 Heat oil in an oven-safe pan over medium-high. Sear salmon skin-side up 3 minutes.
                 Flip, brush generously with teriyaki sauce.
                 Transfer to oven at 400°F. Bake 8 minutes.
                 Brush with more sauce. Serve over steamed rice with sesame seeds and scallions.
                 """,
                 tags: ["japanese", "fish", "weeknight"],
                 ingredients: [
                    ing(2, "", "salmon fillet"),
                    ing(60, "ml", "soy sauce"),
                    ing(60, "ml", "mirin"),
                    ing(2, "tbsp", "sake"),
                    ing(2, "tbsp", "sugar"),
                    ing(1, "tbsp", "vegetable oil"),
                    ing(300, "g", "jasmine rice"),
                    ing(1, "tbsp", "sesame seeds"),
                    ing(3, "", "scallion"),
                 ], context: context),

            // ── 12 ────────────────────────────────────────────────────────────
            make("French Onion Soup", servings: 4,
                 instructions: """
                 Slice onions thinly. Cook in butter over low heat 45 minutes, stirring occasionally, until deep golden.
                 Add garlic, thyme, and flour. Stir and cook 2 minutes.
                 Deglaze with white wine, scraping the bottom.
                 Add beef stock and bay leaves. Simmer 20 minutes. Season.
                 Ladle into oven-safe bowls. Top with a slice of baguette.
                 Pile gruyere on top. Broil until melted and bubbling.
                 """,
                 tags: ["french", "soup", "comfort food"],
                 ingredients: [
                    ing(4, "", "large onion"),
                    ing(3, "clove", "garlic"),
                    ing(60, "g", "butter"),
                    ing(1, "tbsp", "flour"),
                    ing(150, "ml", "white wine"),
                    ing(1, "l", "beef stock"),
                    ing(2, "", "bay leaves"),
                    ing(4, "sprig", "thyme"),
                    ing(1, "", "baguette"),
                    ing(150, "g", "gruyere"),
                 ], context: context),

            // ── 13 ────────────────────────────────────────────────────────────
            make("Mango Coconut Smoothie Bowl", servings: 1,
                 instructions: """
                 Blend frozen mango, banana, and coconut milk until thick and smooth.
                 Pour into a bowl — mixture should be thick enough to hold toppings.
                 Top with granola, sliced fresh mango, coconut flakes, chia seeds, and a drizzle of honey.
                 Eat immediately.
                 """,
                 tags: ["breakfast", "vegan", "quick"],
                 ingredients: [
                    ing(200, "g", "frozen mango"),
                    ing(1, "", "banana"),
                    ing(100, "ml", "coconut milk"),
                    ing(50, "g", "granola"),
                    ing(0.5, "", "fresh mango"),
                    ing(2, "tbsp", "coconut flakes"),
                    ing(1, "tbsp", "chia seeds"),
                    ing(1, "tbsp", "honey"),
                 ], context: context),

            // ── 14 ────────────────────────────────────────────────────────────
            make("BBQ Pulled Pork", servings: 8,
                 instructions: """
                 Rub pork shoulder all over with brown sugar, paprika, garlic powder, onion powder, salt, and pepper.
                 Refrigerate overnight.
                 Place pork in slow cooker with apple cider vinegar and chicken broth.
                 Cook on low 8 hours.
                 Shred pork with two forks. Drain most liquid.
                 Stir in BBQ sauce and cook another 30 minutes.
                 Serve on brioche buns with coleslaw.
                 """,
                 tags: ["american", "pork", "slow cooker"],
                 ingredients: [
                    ing(2, "kg", "pork shoulder"),
                    ing(3, "tbsp", "brown sugar"),
                    ing(2, "tbsp", "smoked paprika"),
                    ing(1, "tbsp", "garlic powder"),
                    ing(1, "tbsp", "onion powder"),
                    ing(60, "ml", "apple cider vinegar"),
                    ing(120, "ml", "chicken broth"),
                    ing(300, "ml", "bbq sauce"),
                    ing(8, "", "brioche bun"),
                    ing(400, "g", "coleslaw mix"),
                 ], context: context),

            // ── 15 ────────────────────────────────────────────────────────────
            make("Margherita Pizza", servings: 4,
                 instructions: """
                 Mix flour, yeast, salt, olive oil, and warm water. Knead 10 minutes. Rest 1 hour.
                 Stretch dough into a 12-inch round on a floured surface.
                 Spread crushed tomatoes over dough, leaving a border.
                 Season with salt, pepper, and a pinch of sugar.
                 Tear mozzarella over the top.
                 Bake at 500°F on a preheated stone or baking sheet for 10-12 minutes.
                 Top with fresh basil and a drizzle of olive oil before serving.
                 """,
                 tags: ["italian", "pizza", "vegetarian"],
                 ingredients: [
                    ing(300, "g", "flour"),
                    ing(1, "tsp", "dry yeast"),
                    ing(1, "tsp", "salt"),
                    ing(2, "tbsp", "olive oil"),
                    ing(200, "ml", "warm water"),
                    ing(200, "g", "crushed tomatoes"),
                    ing(250, "g", "fresh mozzarella"),
                    ing(1, "bunch", "fresh basil"),
                 ], context: context),

            // ── 16 ────────────────────────────────────────────────────────────
            make("Beef Pho", servings: 4,
                 instructions: """
                 Toast star anise, cloves, and cinnamon stick in a dry pan until fragrant.
                 Char onion and ginger over an open flame or under the broiler.
                 Combine stock, charred aromatics, toasted spices, fish sauce, and sugar. Simmer 30 minutes. Strain.
                 Cook rice noodles according to package. Divide among bowls.
                 Ladle hot broth over noodles. Arrange thin beef slices on top — they'll cook in the broth.
                 Serve with bean sprouts, thai basil, lime wedges, hoisin, and sriracha on the side.
                 """,
                 tags: ["vietnamese", "soup", "beef"],
                 ingredients: [
                    ing(2, "l", "beef stock"),
                    ing(300, "g", "beef sirloin"),
                    ing(200, "g", "rice noodles"),
                    ing(1, "", "onion"),
                    ing(1, "piece", "fresh ginger"),
                    ing(3, "", "star anise"),
                    ing(5, "", "cloves"),
                    ing(1, "", "cinnamon stick"),
                    ing(3, "tbsp", "fish sauce"),
                    ing(1, "tbsp", "sugar"),
                    ing(2, "cup", "bean sprouts"),
                    ing(1, "bunch", "thai basil"),
                    ing(2, "", "lime"),
                    ing(2, "tbsp", "hoisin"),
                    ing(2, "tbsp", "sriracha"),
                 ], context: context),

            // ── 17 ────────────────────────────────────────────────────────────
            make("Spinach & Ricotta Stuffed Shells", servings: 6,
                 instructions: """
                 Cook jumbo pasta shells until just al dente. Drain and cool on a baking sheet.
                 Mix ricotta, wilted spinach, parmesan, egg, garlic, nutmeg, salt, and pepper.
                 Spread marinara sauce on the bottom of a baking dish.
                 Fill each shell with the ricotta mixture and arrange in the dish.
                 Pour remaining marinara over shells. Top with mozzarella.
                 Cover with foil and bake at 375°F for 25 minutes.
                 Remove foil and bake another 10 minutes until cheese is bubbly.
                 """,
                 tags: ["italian", "vegetarian", "pasta", "dinner party"],
                 ingredients: [
                    ing(24, "", "jumbo pasta shell"),
                    ing(500, "g", "ricotta"),
                    ing(300, "g", "frozen spinach"),
                    ing(50, "g", "parmesan"),
                    ing(200, "g", "mozzarella"),
                    ing(700, "ml", "marinara sauce"),
                    ing(1, "", "egg"),
                    ing(2, "clove", "garlic"),
                    ing(0.25, "tsp", "nutmeg"),
                 ], context: context),

            // ── 18 ────────────────────────────────────────────────────────────
            make("Chicken Caesar Salad", servings: 2,
                 instructions: """
                 Season chicken with salt, pepper, and garlic powder. Grill or pan-sear until cooked through.
                 Rest 5 minutes then slice thinly.
                 Make dressing: whisk together mayo, lemon juice, garlic, worcestershire, dijon, and parmesan.
                 Toss romaine with dressing until well coated.
                 Plate salad and top with chicken, croutons, extra parmesan, and black pepper.
                 """,
                 tags: ["salad", "chicken", "quick"],
                 ingredients: [
                    ing(2, "", "chicken breast"),
                    ing(1, "head", "romaine lettuce"),
                    ing(3, "tbsp", "mayonnaise"),
                    ing(1, "tbsp", "lemon juice"),
                    ing(1, "tsp", "dijon mustard"),
                    ing(1, "tsp", "worcestershire"),
                    ing(2, "clove", "garlic"),
                    ing(40, "g", "parmesan"),
                    ing(1, "cup", "crouton"),
                 ], context: context),

            // ── 19 ────────────────────────────────────────────────────────────
            make("Lamb Kofta with Tzatziki", servings: 4,
                 instructions: """
                 Combine ground lamb with grated onion, garlic, cumin, coriander, paprika, mint, and parsley.
                 Mix well and shape around skewers into sausage shapes.
                 Refrigerate 30 minutes.
                 Make tzatziki: grate cucumber, squeeze out moisture, combine with yogurt, garlic, dill, lemon, and salt.
                 Grill kofta over medium-high heat, turning occasionally, about 10 minutes.
                 Serve in warm flatbread with tzatziki, tomato, and pickled onion.
                 """,
                 tags: ["middle eastern", "lamb", "grilling"],
                 ingredients: [
                    ing(600, "g", "ground lamb"),
                    ing(1, "", "onion"),
                    ing(4, "clove", "garlic"),
                    ing(1, "tsp", "cumin"),
                    ing(1, "tsp", "coriander"),
                    ing(0.5, "tsp", "smoked paprika"),
                    ing(2, "tbsp", "fresh mint"),
                    ing(2, "tbsp", "fresh parsley"),
                    ing(200, "ml", "greek yogurt"),
                    ing(0.5, "", "cucumber"),
                    ing(2, "tbsp", "fresh dill"),
                    ing(1, "tbsp", "lemon juice"),
                    ing(4, "", "flatbread"),
                    ing(2, "", "tomato"),
                 ], context: context),

            // ── 20 ────────────────────────────────────────────────────────────
            make("Lemon Garlic Butter Shrimp Pasta", servings: 4,
                 instructions: """
                 Cook linguine in salted boiling water until al dente. Reserve 1 cup pasta water before draining.
                 Season shrimp with salt, pepper, and paprika.
                 Melt butter with olive oil in a large skillet over high heat.
                 Sear shrimp 1-2 minutes per side. Remove and set aside.
                 In same pan, sauté garlic 30 seconds. Add white wine and lemon juice, reduce by half.
                 Toss in pasta with a splash of pasta water. Add shrimp back in.
                 Finish with parsley, parmesan, and extra lemon zest.
                 """,
                 tags: ["seafood", "pasta", "weeknight"],
                 ingredients: [
                    ing(400, "g", "linguine"),
                    ing(500, "g", "large shrimp"),
                    ing(5, "clove", "garlic"),
                    ing(4, "tbsp", "butter"),
                    ing(2, "tbsp", "olive oil"),
                    ing(120, "ml", "white wine"),
                    ing(2, "tbsp", "lemon juice"),
                    ing(1, "", "lemon"),
                    ing(0.5, "tsp", "paprika"),
                    ing(50, "g", "parmesan"),
                    ing(1, "bunch", "parsley"),
                 ], context: context),

            // ── 21 ────────────────────────────────────────────────────────────
            make("Overnight Oats", servings: 1,
                 instructions: """
                 Combine oats, chia seeds, milk, and yogurt in a jar. Stir well.
                 Add honey and vanilla. Stir again.
                 Seal and refrigerate overnight.
                 In the morning, add a splash of milk if too thick.
                 Top with peanut butter, sliced banana, honey, and granola.
                 """,
                 tags: ["breakfast", "quick", "meal prep"],
                 ingredients: [
                    ing(0.5, "cup", "rolled oats"),
                    ing(1, "tbsp", "chia seeds"),
                    ing(150, "ml", "milk"),
                    ing(3, "tbsp", "greek yogurt"),
                    ing(1, "tbsp", "honey"),
                    ing(0.5, "tsp", "vanilla"),
                    ing(1, "tbsp", "peanut butter"),
                    ing(1, "", "banana"),
                    ing(2, "tbsp", "granola"),
                 ], context: context),

            // ── 22 ────────────────────────────────────────────────────────────
            make("Butter Chicken", servings: 4,
                 instructions: """
                 Marinate chicken in yogurt, lemon juice, garam masala, and turmeric. Rest 30 minutes.
                 Grill or broil chicken until cooked through. Chop into chunks.
                 Sauté onion in butter until golden. Add garlic, ginger, and spices.
                 Add tomato puree and cook 5 minutes.
                 Blend sauce until smooth. Return to pan.
                 Stir in heavy cream and add chicken. Simmer 10 minutes.
                 Finish with a knob of butter and fenugreek leaves. Serve with naan and rice.
                 """,
                 tags: ["indian", "chicken", "comfort food"],
                 ingredients: [
                    ing(700, "g", "chicken thigh"),
                    ing(150, "g", "yogurt"),
                    ing(400, "g", "tomato puree"),
                    ing(200, "ml", "heavy cream"),
                    ing(1, "", "onion"),
                    ing(4, "clove", "garlic"),
                    ing(1, "tbsp", "fresh ginger"),
                    ing(2, "tbsp", "butter"),
                    ing(1, "tbsp", "garam masala"),
                    ing(1, "tsp", "turmeric"),
                    ing(1, "tsp", "cumin"),
                    ing(1, "tsp", "coriander"),
                    ing(1, "tsp", "kashmiri chili powder"),
                    ing(1, "tbsp", "dried fenugreek leaves"),
                    ing(300, "g", "basmati rice"),
                    ing(4, "", "naan"),
                 ], context: context),

            // ── 23 ────────────────────────────────────────────────────────────
            make("Classic Beef Burger", servings: 4,
                 instructions: """
                 Divide ground beef into 4 equal portions. Shape into patties slightly larger than the buns.
                 Make a small indent in the center of each patty.
                 Season aggressively with salt and pepper on both sides.
                 Grill or cook in a hot cast-iron pan 3-4 minutes per side for medium.
                 Add cheese in the last minute of cooking.
                 Toast buns, spread mayo and mustard.
                 Build: bottom bun, lettuce, tomato, patty, pickles, onion, ketchup, top bun.
                 """,
                 tags: ["american", "beef", "grilling"],
                 ingredients: [
                    ing(700, "g", "ground beef"),
                    ing(4, "", "burger bun"),
                    ing(4, "slice", "cheddar"),
                    ing(4, "leaf", "lettuce"),
                    ing(1, "", "tomato"),
                    ing(8, "", "pickle slice"),
                    ing(0.5, "", "red onion"),
                    ing(2, "tbsp", "mayo"),
                    ing(1, "tbsp", "yellow mustard"),
                    ing(2, "tbsp", "ketchup"),
                 ], context: context),

            // ── 24 ────────────────────────────────────────────────────────────
            make("Pad Thai", servings: 4,
                 instructions: """
                 Soak rice noodles in cold water 30 minutes, drain.
                 Mix fish sauce, tamarind paste, sugar, and oyster sauce for the sauce.
                 Heat wok over high heat with oil. Stir-fry shrimp until pink, set aside.
                 Scramble eggs in the wok, push to side.
                 Add drained noodles and sauce. Toss together until noodles absorb sauce.
                 Add shrimp back, plus bean sprouts and scallions.
                 Plate and top with crushed peanuts, lime, cilantro, and dried chili.
                 """,
                 tags: ["thai", "noodles", "seafood"],
                 ingredients: [
                    ing(300, "g", "rice noodles"),
                    ing(300, "g", "shrimp"),
                    ing(3, "", "egg"),
                    ing(3, "tbsp", "fish sauce"),
                    ing(2, "tbsp", "tamarind paste"),
                    ing(2, "tbsp", "sugar"),
                    ing(1, "tbsp", "oyster sauce"),
                    ing(2, "cup", "bean sprouts"),
                    ing(4, "", "scallion"),
                    ing(60, "g", "roasted peanuts"),
                    ing(2, "", "lime"),
                    ing(1, "bunch", "cilantro"),
                    ing(2, "tbsp", "vegetable oil"),
                 ], context: context),

            // ── 25 ────────────────────────────────────────────────────────────
            make("Roasted Vegetable & Quinoa Bowl", servings: 3,
                 instructions: """
                 Preheat oven to 425°F. Toss sweet potato, broccoli, chickpeas, and red onion with olive oil, cumin, and paprika.
                 Spread on a baking sheet. Roast 25-30 minutes, tossing halfway.
                 Cook quinoa in vegetable stock according to package directions.
                 Whisk together tahini, lemon juice, garlic, and water to make dressing.
                 Divide quinoa among bowls. Pile on roasted vegetables.
                 Drizzle with tahini dressing. Top with pumpkin seeds and fresh herbs.
                 """,
                 tags: ["vegetarian", "vegan", "meal prep", "healthy"],
                 ingredients: [
                    ing(200, "g", "quinoa"),
                    ing(1, "", "sweet potato"),
                    ing(1, "head", "broccoli"),
                    ing(1, "can", "chickpeas"),
                    ing(1, "", "red onion"),
                    ing(3, "tbsp", "olive oil"),
                    ing(1, "tsp", "cumin"),
                    ing(1, "tsp", "smoked paprika"),
                    ing(400, "ml", "vegetable stock"),
                    ing(3, "tbsp", "tahini"),
                    ing(2, "tbsp", "lemon juice"),
                    ing(1, "clove", "garlic"),
                    ing(2, "tbsp", "pumpkin seeds"),
                 ], context: context),

        ]
    }

    // MARK: - Factory

    private static func make(
        _ name: String,
        servings: Double,
        instructions: String,
        tags tagNames: [String],
        ingredients: [Ingredient],
        context: ModelContext
    ) -> Recipe {
        let recipe = Recipe(name: name, servings: servings, instructions: instructions.trimmingCharacters(in: .whitespacesAndNewlines))
        for tagName in tagNames {
            recipe.tags.append(tag(tagName, context: context))
        }
        for ingredient in ingredients {
            context.insert(ingredient)
            recipe.ingredients.append(ingredient)
        }
        return recipe
    }
}
