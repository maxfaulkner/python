# CLAUDE.md — onRepeat iOS App

## CRITICAL: Keeping This File Current

**This file must be updated every time the project changes.** Any time a feature is added, a model changes, a view is restructured, a new file is created, or any architectural decision is made — update the relevant section of this file immediately. The goal is that any new conversation with Claude can read this file and have a complete, accurate picture of the project without reading the source code first.

Things that always require an update to this file:
- New or removed Swift files
- Changes to SwiftData models (fields, relationships, rules)
- New views or significant view restructuring
- Changes to navigation flow
- Changes to how data is queried or mutated
- Any new dependencies or libraries added
- Changes to how the grocery list combining logic works
- Any workarounds, gotchas, or non-obvious decisions made during implementation

---

## Project Overview

**App name**: onRepeat
**Platform**: iOS (iPhone), native Swift app
**Minimum iOS version**: iOS 17.0
**Swift version**: 5.9+
**Bundle ID**: `com.onrepeat.app`
**Xcode project location**: `onRepeatApp/onRepeatApp.xcodeproj`

### What the app does
onRepeat is a personal recipe manager with grocery list generation. The core workflow:
1. User builds up a library of recipes, each with ingredients (quantity + unit + name), step-by-step instructions, a base serving count, and optional tags.
2. On the home screen, the user checks off which recipes they want to make this week.
3. For each checked recipe, the user can adjust the target serving count (defaults to the recipe's base servings).
4. Tapping "Generate Grocery List" combines all ingredients across selected recipes, scales quantities to the target servings, deduplicates by ingredient name + unit, and presents a clean list.
5. The grocery list can be shared as plain text via the iOS share sheet.

The app is fully offline — no network requests, no accounts, no backend. All data lives on-device via SwiftData.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Swift 5.9+ |
| UI framework | SwiftUI |
| Persistence | SwiftData |
| Minimum OS | iOS 17.0 |
| Backend/API | None — fully local |
| Dependencies | None (no SPM packages) |

---

## File Structure

```
onRepeatApp/
├── CLAUDE.md                            ← this file
├── onRepeatApp.xcodeproj/
│   ├── project.pbxproj
│   └── xcshareddata/xcschemes/onRepeatApp.xcscheme
└── onRepeatApp/
    ├── onRepeatAppApp.swift             ← @main, ModelContainer setup
    ├── Models/
    │   ├── Recipe.swift                 ← @Model: Recipe
    │   ├── Ingredient.swift             ← @Model: Ingredient
    │   └── Tag.swift                    ← @Model: Tag
    ├── Views/
    │   ├── RecipeListView.swift         ← Home screen (root view)
    │   ├── RecipeFormView.swift         ← Add/Edit recipe (sheet)
    │   ├── RecipeDetailView.swift       ← Read-only recipe detail (pushed)
    │   └── GroceryListView.swift        ← Generated grocery list (sheet)
    └── Utilities/
        └── IngredientCombiner.swift     ← Combining + normalization logic
```

---

## Data Models

All models use SwiftData (`@Model`). The persistent store is a single SQLite file managed automatically by SwiftData, located in the app's default container on-device. There is no iCloud sync (not yet).

### Recipe

**File**: `onRepeatApp/Models/Recipe.swift`

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key, set on init |
| `name` | `String` | Recipe display name |
| `servings` | `Double` | Base serving count the recipe is written for (e.g. 4.0) |
| `instructions` | `String` | Free-form cooking steps, newline-separated |
| `ingredients` | `[Ingredient]` | Cascade delete — deleting a Recipe deletes all its Ingredients |
| `tags` | `[Tag]` | Many-to-many. Nullify on delete (Tag survives if Recipe is deleted) |
| `createdAt` | `Date` | Set on init, used for default sort order |

Relationship rules:
- `@Relationship(deleteRule: .cascade)` on `ingredients`
- `@Relationship(deleteRule: .nullify, inverse: \Tag.recipes)` on `tags`

### Ingredient

**File**: `onRepeatApp/Models/Ingredient.swift`

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key, set on init |
| `quantity` | `Double` | Numeric amount (e.g. 2.0) |
| `unit` | `String` | Normalized unit string, empty string `""` if unitless (e.g. "3 eggs") |
| `name` | `String` | Normalized: lowercased + trimmed on save |
| `recipe` | `Recipe?` | Back-reference to parent recipe |

`unit` and `name` are normalized at save time (see Normalization section below).

### Tag

**File**: `onRepeatApp/Models/Tag.swift`

| Field | Type | Notes |
|---|---|---|
| `id` | `UUID` | Primary key, set on init |
| `name` | `String` | Unique, lowercase. E.g. `"weeknight"`, `"vegetarian"` |
| `recipes` | `[Recipe]` | Back-reference (inverse of `Recipe.tags`) |

Tags are created lazily — when a recipe is saved with a tag name, `Tag` is looked up by name or created if it doesn't exist.

---

## Data Access Patterns

All data access goes through SwiftData's `@Query` macro and `ModelContext`. There is no repository layer — views query directly.

### Reading recipes
Views that need the full recipe list use:
```swift
@Query(sort: \Recipe.createdAt, order: .reverse) var recipes: [Recipe]
```

### Inserting
```swift
let recipe = Recipe(name: "...", servings: 4, instructions: "...")
modelContext.insert(recipe)
```

### Deleting
```swift
modelContext.delete(recipe)
// Cascades to Ingredient automatically via deleteRule: .cascade
```

### Tags (get-or-create pattern)
Tags are queried by name before insert to avoid duplicates:
```swift
let descriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == tagName })
let existing = try? modelContext.fetch(descriptor).first
let tag = existing ?? Tag(name: tagName)
if existing == nil { modelContext.insert(tag) }
recipe.tags.append(tag)
```

### Editing a recipe's ingredients
On edit save: delete all existing `Ingredient` objects for the recipe and re-insert from form state. Simpler than diffing.

---

## Navigation Structure

```
NavigationStack
└── RecipeListView  (root)
    ├── NavigationLink → RecipeDetailView (pushed onto stack)
    │   └── .sheet → RecipeFormView(mode: .edit)
    ├── toolbar "+" → .sheet → RecipeFormView(mode: .new)
    └── "Generate Grocery List" button → .sheet → GroceryListView
```

`RecipeFormView` is shared for both add and edit via a mode enum:
```swift
enum RecipeFormMode {
    case new
    case edit(Recipe)
}
```

---

## Views

### RecipeListView — Home Screen
**File**: `onRepeatApp/Views/RecipeListView.swift`

The root view. Contains:
- `@Query` to load all recipes sorted by `createdAt` descending
- `@State var selectedRecipes: [UUID: Double]` — maps recipe ID → target servings for checked recipes
- A `List` of recipe rows. Each row has:
  - `Toggle` bound to whether the recipe ID is in `selectedRecipes`
  - Recipe name as a `NavigationLink` to `RecipeDetailView`
  - When selected: a servings stepper/field (default: `recipe.servings`)
- Toolbar trailing: `+` button → sheet with `RecipeFormView(mode: .new)`
- Bottom overlay: "Generate Grocery List" button, disabled when `selectedRecipes` is empty → sheet with `GroceryListView`

### RecipeFormView — Add/Edit
**File**: `onRepeatApp/Views/RecipeFormView.swift`

Presented as a sheet. Contains:
- `@State` draft fields: `name`, `servings`, `instructions`, `tagsText` (comma-separated string), `ingredientRows` (array of `(qty: String, unit: String, name: String)` structs)
- On appear: if mode is `.edit`, populate state from the recipe
- Dynamic ingredient rows: `ForEach` over `ingredientRows` with `.onDelete` for swipe-to-delete; "Add Ingredient" button appends a blank row
- Toolbar: Cancel (dismiss without saving), Save (validate + write to SwiftData)
- Save logic: parse `tagsText`, get-or-create tags, delete old ingredients, insert new ones

### RecipeDetailView — Recipe Detail
**File**: `onRepeatApp/Views/RecipeDetailView.swift`

Pushed via `NavigationLink`. Displays:
- Recipe name (navigation title)
- Servings, tags as pill badges
- Ingredient list
- Instructions (preserved line breaks)
- Toolbar: Edit button (sheet → `RecipeFormView(mode: .edit(recipe))`), Delete button (confirmation alert → delete + dismiss)

### GroceryListView — Grocery List
**File**: `onRepeatApp/Views/GroceryListView.swift`

Presented as a sheet. Receives the `selectedRecipes` dict from `RecipeListView`. On appear, calls `IngredientCombiner.combine(...)`. Displays:
- "This week:" + comma-joined selected recipe names
- Combined/sorted ingredient list
- `ShareLink` button to share as formatted plain text
- Done button to dismiss

---

## Grocery List Logic

**File**: `onRepeatApp/Utilities/IngredientCombiner.swift`

This is pure logic with no SwiftUI or SwiftData dependencies.

### `combine(_ selections: [(recipe: Recipe, targetServings: Double)]) -> [CombinedIngredient]`

Algorithm:
1. For each `(recipe, targetServings)` pair, compute `scale = targetServings / recipe.servings`
2. For each ingredient in the recipe: normalize unit and name, compute `scaledQty = ingredient.quantity * scale`
3. Accumulate into a `[String: Double]` dictionary keyed on `"\(normalizedUnit)|\(normalizedName)"`
4. Map to `[CombinedIngredient]` and sort: grouped by unit (unitless last), then alphabetically by name

### `CombinedIngredient`
```swift
struct CombinedIngredient {
    let quantity: Double
    let unit: String
    let name: String

    var formattedQuantity: String  // "3" for 3.0, "2.5" for 2.5, "0.33" for 0.333
}
```

### Unit normalization
A `[String: String]` lookup dict. Key = input string (lowercased), value = canonical form:

| Input aliases | Canonical |
|---|---|
| `cups`, `cup` | `cup` |
| `tablespoon`, `tablespoons`, `tbsp` | `tbsp` |
| `teaspoon`, `teaspoons`, `tsp` | `tsp` |
| `ounce`, `ounces`, `oz` | `oz` |
| `pound`, `pounds`, `lb`, `lbs` | `lb` |
| `gram`, `grams`, `g` | `g` |
| `kilogram`, `kilograms`, `kg` | `kg` |
| `milliliter`, `milliliters`, `ml` | `ml` |
| `liter`, `liters`, `l` | `l` |
| `clove`, `cloves` | `clove` |
| empty / unrecognized | passed through as-is (lowercased) |

Ingredients with different units for the same name are kept separate — intentional. `"1 can tomatoes"` and `"1 cup tomatoes"` are different things.

---

## App Entry Point

**File**: `onRepeatApp/onRepeatAppApp.swift`

```swift
@main
struct onRepeatAppApp: App {
    var body: some Scene {
        WindowGroup {
            RecipeListView()
        }
        .modelContainer(for: [Recipe.self, Ingredient.self, Tag.self])
    }
}
```

`modelContainer(for:)` automatically creates the SQLite store in the app's default container directory. No manual schema migration is configured yet — SwiftData handles lightweight migration automatically for additive changes.

---

## Servers / Infrastructure

**There are none.** This app has zero backend infrastructure. No API, no server, no database sync, no analytics, no crash reporting (yet). Everything lives in the SwiftData store on-device in the app's sandbox.

If iCloud sync is added in the future, it would use CloudKit via `.modelContainer(for:cloudKitDatabase:)` — update this section when that happens.

---

## Known Gotchas & Non-Obvious Decisions

- **Ingredient edit strategy**: On save, all existing `Ingredient` rows for a recipe are deleted and re-inserted from form state. This avoids diffing complexity and is safe because ingredients have no external references.
- **Tags are shared across recipes**: Deleting a recipe does *not* delete its tags — other recipes may use them. Orphaned tags (tags with no recipes) are harmless but could accumulate. No cleanup is done currently.
- **Unit normalization happens at combine-time, not at save-time**: Ingredients are stored as entered. Normalization only runs inside `IngredientCombiner`. This means the raw data stays human-readable.
- **Servings must be > 0**: The form should prevent 0 or negative servings to avoid divide-by-zero in the scale calculation.
- **`selectedRecipes` is transient state**: The home screen's selection state (`selectedRecipes: [UUID: Double]`) is `@State` — it resets every time the app is relaunched. This is intentional; the weekly selection is not persisted.

---

## What's Not Built Yet (Future Work)

- iCloud sync via CloudKit
- Recipe import from URL / clipboard
- Photo attachment per recipe
- Search/filter by tag on home screen
- Reordering ingredients within a recipe
- Dark mode polish
- iPad layout
- Crash reporting / analytics
