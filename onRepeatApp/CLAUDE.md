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
onRepeat is a personal recipe manager with grocery list generation and social sharing. The core workflow:
1. User builds up a library of recipes, each with ingredients (quantity + unit + name), step-by-step instructions, a base serving count, and optional tags.
2. On the home screen, the user checks off which recipes they want to make this week.
3. For each checked recipe, the user can adjust the target serving count (defaults to the recipe's base servings).
4. Tapping "Generate Grocery List" combines all ingredients across selected recipes, scales quantities to the target servings, groups by grocery category, and presents a check-off list.
5. The grocery list can be shared as plain text via the iOS share sheet.
6. Recipes can be shared via URL deep link or QR code; recipients with the app can tap to import.

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
| QR generation | CIQRCodeGenerator (built-in CoreImage) |

---

## File Structure

```
onRepeatApp/
├── CLAUDE.md                                  ← this file
├── onRepeatApp.xcodeproj/
│   ├── project.pbxproj
│   └── xcshareddata/xcschemes/onRepeatApp.xcscheme
└── onRepeatApp/
    ├── onRepeatAppApp.swift                   ← @main, ModelContainer, deep link handling
    ├── Info.plist                             ← Manual plist; registers onrepeat:// URL scheme
    ├── DesignSystem.swift                     ← Brand colors, gradients, emoji mapper, CardSurface modifier
    ├── Models/
    │   ├── Recipe.swift                       ← @Model: Recipe
    │   ├── Ingredient.swift                   ← @Model: Ingredient
    │   └── Tag.swift                          ← @Model: Tag
    ├── Views/
    │   ├── RecipeListView.swift               ← Home screen (root view)
    │   ├── RecipeCardView.swift               ← Card component used in RecipeListView
    │   ├── RecipeFormView.swift               ← Add/Edit recipe (sheet)
    │   ├── RecipeDetailView.swift             ← Read-only recipe detail (pushed)
    │   ├── GroceryListView.swift              ← Generated grocery list (sheet)
    │   ├── CookModeView.swift                 ← Full-screen step-by-step cook mode (fullScreenCover)
    │   ├── RecipeShareSheet.swift             ← Share options sheet (URL / QR / text)
    │   └── ImportPreviewView.swift            ← Preview + import a shared recipe
    └── Utilities/
        ├── IngredientCombiner.swift           ← Combining + normalization + GroceryCategory
        └── RecipeShareManager.swift           ← URL encoding/decoding for recipe sharing
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
```swift
let descriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == tagName })
let existing = try? modelContext.fetch(descriptor).first
let tag = existing ?? Tag(name: tagName)
if existing == nil { modelContext.insert(tag) }
recipe.tags.append(tag)
```

### Editing a recipe's ingredients
On edit save: delete all existing `Ingredient` objects for the recipe and re-insert from form state.

---

## Navigation Structure

```
NavigationStack
└── RecipeListView  (root)
    ├── NavigationLink → RecipeDetailView (pushed onto stack)
    │   ├── .sheet → RecipeFormView(mode: .edit)
    │   └── .sheet → RecipeShareSheet
    ├── toolbar "+" → .sheet → RecipeFormView(mode: .new)
    └── "Generate Grocery List" button → .sheet → GroceryListView

onRepeatAppApp (URL handler)
└── onrepeat://recipe?v=1&d=<base64> → .sheet → ImportPreviewView
```

`RecipeFormView` is shared for both add and edit via a mode enum:
```swift
enum RecipeFormMode {
    case new
    case edit(Recipe)
}
```

---

## Design System

**File**: `onRepeatApp/DesignSystem.swift`

Central file for all visual tokens and helpers. Never define colors or gradients inline in views.

### Brand Colors
| Token | Hex | Usage |
|---|---|---|
| `Color.brandGreen` | `#2A5C45` | Primary action color, CTAs, checkmarks |
| `Color.brandMid` | `#4A9268` | Gradient partner for brandGreen |
| `Color.appBg` | `#F7F6F3` | App-wide background (off-white) |
| `Color.brandAmber` | `#E8A838` | Accent / highlight color |

### Recipe Gradients (`RecipeGradients`)
- 12 color palettes selected by `abs(recipe.name.hashValue) % 12`
- `RecipeGradients.linearGradient(for: recipe.name)` returns a `LinearGradient`
- Used in hero header, step number circles, and recipe card thumbnails

### Emoji Mapper (`RecipeEmojiMapper`)
- `RecipeEmojiMapper.emoji(name:tags:)` returns a String emoji based on regex patterns matching recipe name and tags
- Falls back to "🍽" if no pattern matches

### Card Surface (`CardSurface` ViewModifier)
- White background, `RoundedRectangle(cornerRadius: 16)` clip, drop shadow
- Applied via `.cardSurface()` convenience modifier on any View

### `Double.displayString`
- `3.0` → `"3"`, `2.5` → `"2.5"` (trims trailing zeros)

---

## Views

### RecipeListView — Home Screen
**File**: `onRepeatApp/Views/RecipeListView.swift`

The root view. Contains:
- `@Query` to load all recipes sorted by `createdAt` descending
- `@State var selectedRecipes: [UUID: Double]` — maps recipe ID → target servings
- Horizontal tag filter chip row (Capsule-shaped, filters `filteredRecipes`)
- `.searchable` for recipe name / tag / ingredient search
- `RecipeCardView` for each recipe (gradient thumbnail, emoji, name, tags, selection state, servings stepper)
- Animated gradient "Generate Grocery List" CTA at bottom (appears/disappears with spring animation)
- Toolbar: green circle `+` button → sheet with `RecipeFormView(mode: .new)`; "Clear" button when recipes are selected

### RecipeCardView — Recipe Card
**File**: `onRepeatApp/Views/RecipeCardView.swift`

Reusable card component. Shows:
- Left: 60×60 gradient square with emoji
- Right: recipe name, servings count pill, tag chips
- Selection circle (top-right corner) — animates to filled checkmark when selected
- When selected: animated stepper row slides in with green left-border accent and serving count

### RecipeFormView — Add/Edit
**File**: `onRepeatApp/Views/RecipeFormView.swift`

Presented as a sheet. Three card sections:
1. **Recipe Info**: name TextField, servings Stepper, tag add/remove with FlowLayout chip display
2. **Ingredients**: column header (QTY / UNIT / INGREDIENT), List with `IngredientRowView` rows, swipe-to-delete, "Add Ingredient" button
3. **Instructions**: TextEditor with hint text

`FlowLayout` is a custom `Layout` implementation for wrapping tag chips.

Tags are managed as `@State var tagChips: [String]` — added via TextField submit, removed via × button on each chip.

Save logic: parse ingredient rows, get-or-create tags, delete old ingredients, insert new ones.

### RecipeDetailView — Recipe Detail
**File**: `onRepeatApp/Views/RecipeDetailView.swift`

Pushed via `NavigationLink`. Contains:
- **Hero header**: full-width gradient fill (280pt min height) with scrim overlay, large emoji (60pt), recipe name in black rounded font, meta pills (servings, ingredient count)
- **Content**: horizontal tag chips, ingredients card (green quantity + unit columns, sorted alphabetically), numbered step instructions (gradient circle step numbers)
- Toolbar: Share button → `RecipeShareSheet`, Edit button → `RecipeFormView(mode: .edit)`, trash Delete button with confirmation alert

### GroceryListView — Grocery List
**File**: `onRepeatApp/Views/GroceryListView.swift`

Presented as a sheet. Receives `selections: [(recipe: Recipe, targetServings: Double)]`. Contains:
- **Recipe strip**: horizontal scroll of recipe pills with emoji thumbnail and optional serving multiplier badge
- **Progress bar**: animated linear fill, "X of Y items" label, Reset button
- **Category sections**: grouped by `GroceryCategory`, each with colored header (icon + category color), per-item check-off rows with animated strikethrough + circle fill
- **Recipe attribution**: when multiple recipes selected, each item shows which recipes need it (below the ingredient name)
- **Manual items**: "Add item manually" button at bottom reveals inline text field to add custom grocery items (e.g. paper towels). Manual items appear in the "Other" category with a delete button and "added manually" label. Persisted per-session.
- **Completed state**: shown when all items checked — green checkmark, "You're all set!" message, "Start Over" button
- ShareLink in toolbar exports plain text list

Checked state is persisted to `UserDefaults` via a key derived from the sorted recipe IDs (`groceryChecked_<hashValue>`). Manual items are also persisted under `groceryManual_<hashValue>`. Both load in `.onAppear`. Manual items use `ManualItem: Identifiable, Codable` (id: UUID, name: String) stored as a private struct in the file.

`CombinedIngredient` has a `manualID: UUID?` field — `nil` for recipe items, set for manual items. `itemKey` for manual items is `"manual_<uuid>"` to avoid collisions.

### CookModeView — Step-by-Step Cook Mode
**File**: `onRepeatApp/Views/CookModeView.swift`

Presented as a `fullScreenCover` from `RecipeDetailView`. Full-screen dark UI using the recipe's gradient palette overlaid with a dark scrim. Contains:
- **Top bar**: recipe name, "Step X of Y" subtitle, animated progress bar, X dismiss button (asks for exit confirmation if progress has been made)
- **Step content**: large step number badge (circle with gradient border), step text centered in a ScrollView, "Done" chip if step already completed
- **Navigation**: "Done, Next Step" button + left chevron for going back. On the last step: "Finish Cooking" button that auto-dismisses after 0.4s.
- **Step dots**: dot indicator row (shown when ≤12 steps), filled dots = completed steps, larger dot = current step
- **Single block mode**: when instructions can't be split into multiple lines, shows all text at once without step navigation
- **Exit confirmation alert**: shown when dismissing mid-cook after making progress

Steps are parsed identically to `RecipeDetailView.instructionsCard` — split on `\n`, trimmed, filter empty.

### RecipeShareSheet — Share Options
**File**: `onRepeatApp/Views/RecipeShareSheet.swift`

Presented as a sheet from `RecipeDetailView`. Shows a mini recipe preview card at top, then three share options:
1. **Share Link** — `ShareLink` with the `onrepeat://` deep link URL
2. **Show QR Code** — opens `QRCodeView` sheet with the generated QR image and a save/share button
3. **Share as Text** — `ShareLink` with plain-text recipe export

`QRCodeView` uses `RecipeShareManager.qrCode(for:)` to generate the image via `CIQRCodeGenerator`.

### ImportPreviewView — Shared Recipe Import
**File**: `onRepeatApp/Views/ImportPreviewView.swift`

Presented as a sheet from `onRepeatAppApp` when an `onrepeat://` URL is opened. Shows:
- Hero card with gradient and emoji (same style as RecipeDetailView)
- Ingredient list preview
- Instructions preview
- "Add to My Library" button — inserts recipe via SwiftData with get-or-create tag logic
- Cancel button to dismiss

---

## Social Sharing

**File**: `onRepeatApp/Utilities/RecipeShareManager.swift`

### Encoding
`RecipeShareManager.shareURL(for recipe: Recipe) -> URL?`

Encodes the recipe as:
```
onrepeat://recipe?v=1&d=<base64url-encoded JSON>
```

JSON payload (`SharedRecipePayload`):
```swift
struct SharedRecipePayload: Codable {
    let name: String
    let servings: Double
    let instructions: String
    let ingredients: [SharedIngredientPayload]
    let tags: [String]
}
struct SharedIngredientPayload: Codable {
    let quantity: Double
    let unit: String
    let name: String
}
```

### Decoding
`RecipeShareManager.decode(url: URL) -> SharedRecipePayload?`

Validates `url.scheme == "onrepeat"`, `url.host == "recipe"`, query param `v == "1"`, then base64-decodes and JSON-decodes the `d` param.

### QR Code
`RecipeShareManager.qrCode(for recipe: Recipe, size: CGFloat = 280) -> UIImage?`

Uses `CIFilter(name: "CIQRCodeGenerator")` with the URL string, scales up via `CILanczosScaleTransform`.

### App Entry Point (Deep Link)
**File**: `onRepeatApp/onRepeatAppApp.swift`

```swift
.onOpenURL { url in
    if let payload = RecipeShareManager.decode(url: url) {
        pendingImport = payload
        showingImport = true
    }
}
.sheet(isPresented: $showingImport) {
    if let payload = pendingImport { ImportPreviewView(payload: payload) }
}
```

### URL Scheme Registration
**File**: `onRepeatApp/Info.plist`

Manual plist (replaces Xcode-generated). Registers `onrepeat` scheme under `CFBundleURLTypes`. The build setting `INFOPLIST_FILE = onRepeatApp/Info.plist` points to this file; `GENERATE_INFOPLIST_FILE` is NOT set.

---

## Grocery List Logic

**File**: `onRepeatApp/Utilities/IngredientCombiner.swift`

### `GroceryCategory`
```swift
enum GroceryCategory: String, CaseIterable, Comparable {
    case produce, dairy, meat, bakery, grains, canned,
         spices, condiments, beverages, frozen, other
}
```
- `Comparable` conformance uses `allCases` index order (produce first, other last)
- `categorize(_ name: String) -> GroceryCategory` — pure string pattern matching on lowercased ingredient name
- UI extensions (color, systemImage) are in `DesignSystem.swift`

### `combine(_ selections:) -> [CombinedIngredient]`

Algorithm:
1. For each `(recipe, targetServings)` pair, compute `scale = targetServings / recipe.servings`
2. Normalize unit and name, accumulate scaled quantity in dict keyed on `"\(unit)|\(name)"`
3. Map to `[CombinedIngredient]` and sort by category → unit → name

### `CombinedIngredient`
```swift
struct CombinedIngredient: Identifiable {
    let quantity: Double
    let unit: String
    let name: String
    let category: GroceryCategory
    let sources: [String]       // recipe names that contribute to this item
    var manualID: UUID? = nil   // non-nil for manually added items
    var formattedQuantity: String  // "3" for 3.0, "2.5" for 2.5
}
```

### Unit normalization
A `[String: String]` lookup dict. Key = input string (lowercased), value = canonical form:

| Input aliases | Canonical |
|---|---|
| `cups`, `cup` | `cup` |
| `tablespoon`, `tablespoons`, `tbsp`, `tbs` | `tbsp` |
| `teaspoon`, `teaspoons`, `tsp` | `tsp` |
| `ounce`, `ounces`, `oz` | `oz` |
| `pound`, `pounds`, `lb`, `lbs` | `lb` |
| `gram`, `grams`, `g` | `g` |
| `kilogram`, `kilograms`, `kg` | `kg` |
| `milliliter`, `milliliters`, `ml` | `ml` |
| `liter`, `liters`, `l` | `l` |
| `clove`, `cloves` | `clove` |
| `can`, `cans` | `can` |
| `pinch`, `pinches` | `pinch` |
| `bunch`, `bunches` | `bunch` |
| `slice`, `slices` | `slice` |
| `piece`, `pieces` | `piece` |
| empty / unrecognized | passed through as-is (lowercased) |

---

## App Entry Point

**File**: `onRepeatApp/onRepeatAppApp.swift`

```swift
@main struct onRepeatAppApp: App {
    @State private var pendingImport: SharedRecipePayload? = nil
    @State private var showingImport = false
    var body: some Scene {
        WindowGroup {
            RecipeListView()
                .onOpenURL { url in
                    if let payload = RecipeShareManager.decode(url: url) {
                        pendingImport = payload; showingImport = true
                    }
                }
                .sheet(isPresented: $showingImport) {
                    if let payload = pendingImport { ImportPreviewView(payload: payload) }
                }
        }
        .modelContainer(for: [Recipe.self, Ingredient.self, Tag.self])
    }
}
```

---

## Servers / Infrastructure

**There are none.** This app has zero backend infrastructure. No API, no server, no database sync, no analytics, no crash reporting. Everything lives in the SwiftData store on-device in the app's sandbox.

Social sharing works entirely via URL schemes — no server required. The full recipe payload is encoded inline in the URL.

---

## Known Gotchas & Non-Obvious Decisions

- **Ingredient edit strategy**: On save, all existing `Ingredient` rows for a recipe are deleted and re-inserted from form state. This avoids diffing complexity.
- **Tags are shared across recipes**: Deleting a recipe does *not* delete its tags. Orphaned tags (no recipes) are harmless but accumulate. No cleanup done currently.
- **Unit normalization happens at combine-time, not at save-time**: Ingredients are stored as entered. Normalization only runs inside `IngredientCombiner`.
- **Servings must be > 0**: Required to avoid divide-by-zero in scale calculation.
- **`selectedRecipes` persists across launches**: Saved to UserDefaults under key `weeklySelection` as JSON `[String: Double]` (UUID string → target servings). Loaded in `.onAppear`, validated against current recipe IDs. Selection automatically rehydrates when app is relaunched mid-week.
- **Info.plist is manual**: `GENERATE_INFOPLIST_FILE` is NOT set. Build setting `INFOPLIST_FILE = onRepeatApp/Info.plist`. The manual plist registers the `onrepeat://` URL scheme for deep linking.
- **GroceryCategory `< ` uses allCases index**: Order is produce → dairy → meat → bakery → grains → canned → spices → condiments → beverages → frozen → other.
- **Share URL uses base64url (no padding)**: `Data.base64EncodedString()` output has `+` and `/` replaced with `-` and `_`, and `=` padding stripped, to be URL-safe.
- **QR code scaling**: `CIQRCodeGenerator` output is tiny (typically 33×33 px); it's scaled up via `CILanczosScaleTransform` to the requested `size`.

---

## What's Not Built Yet (Future Work)

- iCloud sync via CloudKit
- Photo attachment per recipe
- Reordering ingredients within a recipe
- iPad layout
- Crash reporting / analytics
- Orphaned tag cleanup
- Meal planning calendar view
- Nutrition info per ingredient
- Import from popular recipe websites
