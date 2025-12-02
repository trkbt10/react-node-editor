# Theme Development Guide

This document describes how to create, modify, and manage themes for the node editor.

## Architecture Overview

```
scripts/themes-catalog.json     ← Single source of truth for theme metadata
        ↓
┌───────┴───────┐
↓               ↓
generate:       generate:
theme-exports   theme-registry
↓               ↓
package.json    src/examples/themes/generated-themes.ts
(exports)       (runtime registry)
```

## Theme Files

- **Theme CSS**: `public/themes/{theme-id}.css`
- **Base tokens**: `src/global.css` (defines all CSS custom properties)
- **Catalog**: `scripts/themes-catalog.json` (theme metadata)

## Adding a New Theme

### 1. Create the CSS file

Create `public/themes/{your-theme}.css` with all design tokens:

```css
:root {
  /* Copy all tokens from src/global.css and customize values */
  --node-editor-space-xs: 4px;
  /* ... */
}
```

### 2. Add to catalog

Edit `scripts/themes-catalog.json`:

```json
{
  "id": "your-theme",
  "label": "Your Theme",
  "description": "Brief description of the theme's visual style.",
  "cssFile": "your-theme.css"
}
```

### 3. Generate files

```bash
bun run generate:themes
```

This runs both:
- `generate:theme-exports` - Updates package.json exports
- `generate:theme-registry` - Updates TypeScript registry

### 4. Verify token coverage

```bash
bun run check:theme-tokens
```

Ensure your theme has high coverage (ideally 100%).

## Modifying Theme Metadata

1. Edit `scripts/themes-catalog.json`
2. Run `bun run generate:themes`

## Design Tokens

### Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Spacing | `--node-editor-space-*` | `--node-editor-space-md` |
| Typography | `--node-editor-font-*` | `--node-editor-title-font` |
| Colors | `--node-editor-*-color` | `--node-editor-accent-color` |
| Surfaces | `--node-editor-surface-*` | `--node-editor-surface-primary` |
| Controls | `--node-editor-control-*` | `--node-editor-control-background` |
| Inspector | `--node-editor-inspector-*` | `--node-editor-inspector-segment-*` |
| Cards | `--node-editor-card-*` | `--node-editor-card-border-radius` |
| Shadows | `--node-editor-shadow-*` | `--node-editor-shadow-md` |

### Checking Token Coverage

```bash
# Check all themes
bun run check:theme-tokens

# Strict mode (fails if any tokens are missing)
bun run check:theme-tokens --strict
```

Output explains:
- **Coverage %**: How many base tokens are defined
- **Missing tokens**: Base tokens not defined in theme (will use defaults)
- **Extra tokens**: Theme-specific tokens not in base

## Visual Testing

Visual regression tests ensure themes render correctly:

```bash
# Run visual tests
bun run test:visual

# Update baseline screenshots after intentional changes
bun run test:visual:update

# View test report
bun run test:visual:report
```

Screenshots are stored in `e2e/__screenshots__/`.

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `generate:themes` | Generate all theme-related files |
| `generate:theme-exports` | Update package.json exports |
| `generate:theme-registry` | Update TypeScript registry |
| `check:theme-tokens` | Check token coverage across themes |
| `test:visual` | Run visual regression tests |
| `test:visual:update` | Update baseline screenshots |

## File Reference

| File | Purpose |
|------|---------|
| `scripts/themes-catalog.json` | Theme metadata (source of truth) |
| `scripts/themes-catalog.schema.json` | JSON schema for catalog validation |
| `scripts/generate-theme-exports.ts` | Generates package.json theme exports |
| `scripts/generate-theme-registry.ts` | Generates TypeScript theme registry |
| `scripts/check-theme-tokens.ts` | Token coverage checker |
| `src/global.css` | Base design tokens (all CSS variables) |
| `src/examples/themes/generated-themes.ts` | Auto-generated theme definitions |
| `src/examples/themes/registry.ts` | Theme loading/switching utilities |
| `public/themes/*.css` | Individual theme CSS files |
