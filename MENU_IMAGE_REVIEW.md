# Menu Image Review

Last reviewed: 2026-04-09

This project is currently using online placeholder images for many menu items.
They are acceptable for temporary launch use, but they are not all dish-perfect.

## Current Reality

- Most single-item sushi, finger foods, and drinks are acceptable temporary matches.
- The weakest placeholders are combo items, assortments, and a few poke bowls.
- Real food photos from the client will still be the best final solution.

## Highest Priority Replacements

These items are the least accurate and should be replaced first if better online images or client photos become available:

- `Starter Combo (6pcs)` in `Finger Foods`
- `Party Combo` in `Finger Foods`
- `Mori (6 pcs)` in `Sushi Assortments`
- `Shake (12 pcs)` in `Sushi Assortments`
- `In-house Chicken Poke` in `Poke Bowls`
- `Prawns Special Poke` in `Poke Bowls`
- `Special Tofu Poke` in `Poke Bowls`

## Good Temporary Placeholder Groups

These are reasonable enough for now:

- individual maki rolls
- grilled salmon sushi items
- gyoza
- fried chicken
- spring rolls
- french fries
- soft drinks
- green tea

## Important Note

Online stock images can only be "close enough."
They cannot honestly guarantee that the dish shown matches the exact restaurant plating, portion, garnish, or recipe.

For a client-ready final version, use this order of preference:

1. real photos from Sumi Sushi and Poke
2. highly specific online images that match the exact dish type
3. category-level placeholders only as a last resort

## Developer Helper

Use this command to audit likely problem items again after menu updates:

```bash
npm run audit:menu-images
```
