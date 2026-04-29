# Design System: Kistenscanner

## 1. Visual Theme & Atmosphere

Kistenscanner is a dark-mode-native inventory tool for scanning, cataloging and finding physical objects stored in boxes. The interface must feel like a precision instrument — calm, structured, invisible until needed. Darkness is the native medium, not a theme applied over a light design. Content emerges from a near-black canvas through carefully calibrated luminance steps.

The design philosophy borrows from Linear's engineering precision: semi-transparent borders instead of hard edges, background luminance stacking instead of shadows, and a single accent color reserved strictly for interactive elements. Photography of box contents is the only "color" in the interface — the UI itself stays achromatic with one blue accent.

This is a mobile-first tool used on phones for scanning QR codes and photographing box contents, and on desktop/tablet for browsing inventory and printing labels. Every component must work flawlessly at 320px and scale gracefully to 1440px+.

**Key Characteristics:**
- Dark-mode-native: `#08090a` base, `#0f1011` panels, `#161718` cards, `#1c1d1f` elevated surfaces
- Single accent color: Apple Blue `#0071e3` (interactive), `#2997ff` (on dark backgrounds), `#005bb5` (pressed)
- Inter Variable with OpenType features `"cv01", "ss03"` — geometric alternates for clean, tool-like character
- Semi-transparent white borders throughout: `rgba(255,255,255,0.06)` default, `rgba(255,255,255,0.10)` hover
- Luminance stacking for depth — no drop shadows on dark surfaces
- Item photography is the only source of color — UI chrome stays neutral
- Mobile: bottom nav with icons only, no labels
- Desktop: left sidebar with icons + labels

## 2. Color Palette & Roles

### Background Surfaces (4-tier luminance stack)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-base` | `#08090a` | Page canvas, deepest background |
| `--bg-panel` | `#0f1011` | Sidebar, bottom nav, fixed panels |
| `--bg-card` | `#161718` | Cards, list items, content containers |
| `--bg-elevated` | `#1c1d1f` | Hover states, dropdowns, popovers, modals |

### Text (4-tier opacity hierarchy)

| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#f0f1f2` | Headings, primary content — NOT pure white |
| `--text-secondary` | `#a0a4ab` | Body text, descriptions, metadata |
| `--text-tertiary` | `#6b7080` | Placeholders, hints, timestamps |
| `--text-quaternary` | `#484c54` | Disabled states, decorative labels |

### Accent (Apple Blue)

| Token | Hex | Use |
|-------|-----|-----|
| `--accent` | `#0071e3` | Primary CTA backgrounds, focus rings |
| `--accent-bright` | `#2997ff` | Links on dark backgrounds, active nav icon |
| `--accent-hover` | `#0077ed` | Button hover state |
| `--accent-pressed` | `#005bb5` | Button active/pressed state |
| `--accent-muted` | `rgba(0,113,227,0.12)` | Active nav item background, subtle highlights |

### Status

| Token | Hex | Use |
|-------|-----|-----|
| `--success` | `#30d158` | Item count badges, success states |
| `--warning` | `#ffd60a` | Warnings only |
| `--danger` | `#ff453a` | Delete actions, errors |

### Border & Divider

| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `rgba(255,255,255,0.06)` | Default card/container borders |
| `--border-default` | `rgba(255,255,255,0.10)` | Input borders, hover state borders |
| `--border-strong` | `rgba(255,255,255,0.16)` | Active/focus input borders |

## 3. Typography Rules

### Font Family
- **Primary**: `'Inter Variable', 'Inter', -apple-system, system-ui, sans-serif`
- **OpenType Features**: `font-feature-settings: "cv01", "ss03"` on `html` — applied globally, non-negotiable
- No monospace font needed in this app

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Use |
|------|------|--------|-------------|----------------|-----|
| Page title | 24px (1.5rem) | 600 | 1.15 | -0.48px | "Behälter", "Scannen" — one per page |
| Section label | 11px (0.688rem) | 600 | 1.2 | 0.08em | Uppercase kickers: "INVENTAR", "STANDORT", "ITEMS" |
| Card title | 16px (1rem) | 500 | 1.3 | -0.18px | Box name, item name |
| Body | 14px (0.875rem) | 400 | 1.5 | -0.1px | Descriptions, metadata values |
| Small | 12px (0.75rem) | 400 | 1.4 | normal | Badges, timestamps, tertiary info |
| Button | 14px (0.875rem) | 500 | 1.0 | -0.08px | All button labels |
| Nav label (desktop) | 12px (0.75rem) | 500 | 1.2 | 0.06em | Sidebar icon labels |

### Principles
- **Two weights in practice**: 400 (reading) and 500 (emphasis/interactive). 600 only for page titles and section kickers.
- **Negative letter-spacing** at 16px+ — tighter text feels engineered, not designed.
- **Section kickers** are always uppercase, 11px, weight 600, `--text-tertiary` color, `letter-spacing: 0.08em`.
- No font size below 11px. No weight above 600.

## 4. Component Stylings

### Buttons

**Primary (CTA)**
- Background: `var(--accent)` (`#0071e3`)
- Color: `#ffffff`
- Border: none
- Border-radius: 8px
- Padding: 0 16px
- Height: 40px
- Font: 14px, weight 500
- Hover: `var(--accent-hover)` (`#0077ed`)
- Active: `var(--accent-pressed)` (`#005bb5`)
- Transition: background 0.15s ease

**Ghost (Secondary)**
- Background: `rgba(255,255,255,0.03)`
- Color: `var(--text-secondary)`
- Border: `1px solid var(--border-subtle)`
- Border-radius: 8px
- Padding: 0 16px
- Height: 40px
- Font: 14px, weight 500
- Hover: background `rgba(255,255,255,0.06)`, border `var(--border-default)`, color `var(--text-primary)`

**Danger**
- Background: transparent
- Color: `var(--danger)` (`#ff453a`)
- Border: `1px solid rgba(255,69,58,0.3)`
- Border-radius: 8px
- Height: 40px
- Hover: background `rgba(255,69,58,0.1)`

**Icon Button (square, for toolbars)**
- Background: `rgba(255,255,255,0.03)`
- Color: `var(--text-secondary)`
- Border: `1px solid var(--border-subtle)`
- Border-radius: 8px
- Size: 40×40px, flex centered
- Hover: background `rgba(255,255,255,0.06)`, color `var(--text-primary)`

**Button Rules:**
- Minimum touch target: 40px height
- 1 button = full container width
- 2 buttons = 50/50 flex (`flex: 1` each)
- 3+ buttons = icon-only or overflow menu (⋯)
- Toolbar actions (edit, print, share, delete) are ALWAYS icon-only `btn-icon`, never stretched
- Primary + Ghost side by side: Primary left, Ghost right

### Cards

**Standard card (box overview, item card)**
- Background: `var(--bg-card)` (`#161718`)
- Border: `1px solid var(--border-subtle)`
- Border-radius: 10px
- Overflow: hidden
- Hover: border-color transitions to `var(--border-default)`
- **No drop shadows.** Depth comes from luminance difference between `--bg-base` and `--bg-card`.

### Inputs

- Background: `rgba(255,255,255,0.03)`
- Color: `var(--text-primary)`
- Border: `1px solid var(--border-default)`
- Border-radius: 8px
- Padding: 10px 12px
- Font: 14px, weight 400
- Height: 40px
- Focus: border-color `var(--accent)`, box-shadow `0 0 0 3px var(--accent-muted)`
- Placeholder color: `var(--text-tertiary)`

### Badges

**Item count badge (e.g. "8 Items")**
- Background: `rgba(0,113,227,0.12)`
- Color: `var(--accent-bright)` (`#2997ff`)
- Font: 11px, weight 600
- Padding: 2px 8px
- Border-radius: 6px
- Letter-spacing: 0.04em

### Context Menu (replaces scattered icon buttons)

Item actions (edit, upload photo, move, delete) are hidden behind a single ⋯ icon button that opens a context menu:

- Container: `var(--bg-elevated)`, `1px solid var(--border-default)`, border-radius 10px, padding 4px, min-width 180px
- Shadow: `0 8px 24px rgba(0,0,0,0.4)` — floating elements are the ONLY place shadows are allowed
- Menu item: flex row, gap 10px, padding 8px 12px, border-radius 6px, font 14px, color `var(--text-secondary)`
- Menu item hover: background `rgba(255,255,255,0.06)`, color `var(--text-primary)`
- Danger item: color `var(--danger)`

### Navigation

**Mobile — Bottom nav bar (below 1024px)**
- Position: fixed bottom, full width
- Height: 56px + `env(safe-area-inset-bottom)`
- Background: `var(--bg-panel)`
- Border-top: `1px solid var(--border-subtle)`
- Layout: flex, space-around
- Items: 44×44px tap area, border-radius 10px
- Default: color `var(--text-tertiary)`
- Active: color `var(--accent-bright)`, background `var(--accent-muted)`
- **Icons only, no text labels on mobile**
- Maximum 7 items in one row

**Desktop — Left sidebar (1024px and above)**
- Position: fixed left, full height
- Width: 72px
- Background: `var(--bg-panel)`
- Border-right: `1px solid var(--border-subtle)`
- Layout: flex column, centered, gap 4px, padding 16px 0
- Items: 56px wide, flex column, gap 4px, padding 8px, border-radius 10px
- Icon: 20px
- Label: 10px, weight 500, letter-spacing 0.04em
- Default: color `var(--text-tertiary)`
- Active: color `var(--accent-bright)`, background `var(--accent-muted)`
- Hover: color `var(--text-primary)`, background `rgba(255,255,255,0.04)`

### Image Treatment

- Item thumbnails: border-radius 6px, object-fit cover
- Box overview photos: fill top of card, border-radius 10px 10px 0 0
- Missing image placeholder: `var(--bg-elevated)` background, centered Material Symbol icon (24px), `var(--text-quaternary)` color
- No borders on images — the dark card background provides natural framing

## 5. Layout Principles

### Spacing System

Base unit: 8px. All spacing values are multiples of 4px.

| Token | Value | Use |
|-------|-------|-----|
| `--space-xs` | 4px | Inline gaps, badge padding |
| `--space-sm` | 8px | Tight gaps inside cards |
| `--space-md` | 12px | Standard gaps, card padding |
| `--space-lg` | 16px | Section gaps, larger padding |
| `--space-xl` | 24px | Between sections |
| `--space-2xl` | 32px | Page-level spacing |

### Content Widths by Route

| Route | Mobile | Tablet (≥768px) | Desktop (≥1024px) | Large (≥1280px) |
|-------|--------|-----------------|-------------------|-----------------|
| All app pages | 100% - 16px padding | max 640px centered | max 720px | max 800px |
| Box detail | 100% - 16px padding | max 640px centered | max 840px | max 960px |
| Box grid (Kisten) | 100% - 16px padding | 2-col grid | 3-col grid | 4-col grid |

- Desktop page offset: `margin-left: 72px` (sidebar width)
- Mobile page bottom pad: `padding-bottom: 72px` (bottom nav + safe area)

### Box Overview Grid

- Mobile: `grid-template-columns: 1fr`
- ≥640px: `repeat(2, 1fr)`
- ≥1024px: `repeat(3, 1fr)`
- ≥1280px: `repeat(4, 1fr)`
- Gap: 12px

### Page Header Pattern

Every page uses the same header structure:
[Section kicker — 11px, uppercase, --text-tertiary]
[Page title — 24px, weight 600, --text-primary]    [Optional action button, right-aligned]

## 7. Do's and Don'ts

### Do
- Use Inter Variable with `"cv01", "ss03"` on ALL text — non-negotiable
- Use semi-transparent white borders `rgba(255,255,255,0.06)` instead of solid dark borders
- Keep button backgrounds nearly transparent for ghost buttons
- Reserve Apple Blue (`#0071e3` / `#2997ff`) for interactive elements ONLY
- Use `--text-primary` (`#f0f1f2`) for headings — NOT pure `#ffffff`
- Use the 4-tier luminance stack for depth instead of shadows
- Hide item actions behind a context menu (⋯) — max 1-2 visible quick actions
- Use consistent 40px touch targets for all interactive elements
- Keep page headers to kicker + title + optional action — nothing more

### Don't
- Don't use pure white (`#ffffff`) as text or backgrounds
- Don't use solid colored backgrounds on cards — `--bg-card` is the only card fill
- Don't use drop shadows on cards or panels — only on floating/overlay elements
- Don't show more than 2 action icons per item card without a context menu
- Don't use text labels on mobile bottom nav — icons only
- Don't add explanatory paragraphs or step-summary cards to page headers
- Don't use border-radius larger than 12px on rectangular elements
- Don't use weight 700 (bold) — maximum is 600 for page titles and kickers
- Don't introduce additional accent colors — Apple Blue is the only chromatic color
- Don't use solid opaque borders — all borders are semi-transparent white on dark

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Bottom nav (icons only), single column, 16px page padding |
| Tablet | 640–1023px | Bottom nav, 2-column box grid, centered content max 640px |
| Desktop | 1024–1279px | Left sidebar (72px), 3-column box grid, content max 720–840px |
| Large | ≥1280px | Left sidebar, 4-column box grid, content max 800–960px |

### Navigation Switch
- Below 1024px: Bottom nav bar (fixed, 56px height, icons only)
- 1024px and above: Left sidebar (fixed, 72px width, icons + labels)

### Touch Targets
- All buttons: 40px minimum height
- Nav items: 44×44px tap area
- Item cards: entire card is tappable to open detail
- Context menu trigger (⋯): 40×40px

### Collapsing Strategy
- Page titles stay at 24px across all breakpoints
- Box grid: 4 → 3 → 2 → 1 column
- BoxDetail toolbar: icon buttons stay 40×40, scroll horizontally if overflow
- BoxDetail item list: always single column, never grid on mobile
- Sticker print section: collapsed by default, full-width when open
- Search input: always full width within content area

## 9. Screen-Specific Guidelines

### Suchen (Search)
- Search input at top, full width, with search icon left and optional filter icon right
- Live results appear as item cards below (thumbnail + name + box name + location)
- Empty state: centered icon + "Mindestens 2 Zeichen eingeben" in `--text-tertiary`

### Scannen (Scanner)
- Camera viewfinder takes full available height above bottom nav
- QR/Barcode toggle: 2 ghost buttons, 50/50 width, active button gets `--accent-muted` background
- Fallback state (no camera): centered camera icon + message + 2 buttons (50/50)

### Hinzufügen (Add Box)
- Step 1: Photo capture area (camera or upload)
- Step 2: AI analysis results as editable item cards
- Step 3: Box metadata form (name, location) + save button (full width, primary)
- No step indicators or summary cards at top

### Kisten (Box Overview)
- Page header: "INVENTAR" kicker + "Behälter" title + "Behälter hinzufügen" ghost button right-aligned
- Grid of box cards, each showing: photo (top), metadata row (type badge + item count badge), box name, location

### Box Detail
- **Header**: Compact single row — QR code (48×48) left, then: location as primary text (16px, weight 500), metadata row below (Kiste #, Name, Items count) in `--text-secondary` 12px
- **Toolbar**: Row of `btn-icon` buttons (40×40): Bearbeiten, Foto, Drucken, Teilen, Zurück. Delete button last with `--danger` color. Horizontal scroll if overflow.
- **Sticker section**: Collapsed by default. Label "Stickerdruck" + "Aufklappen" ghost button.
- **Item list**: Section kicker "ITEMS" + "Inhalt" title + grid/list toggle icon + add button (icon)
  - Each item row: thumbnail (48×48, radius 6px) + name (16px, weight 500) + description (14px, `--text-secondary`) + context menu button (⋯)
  - Context menu contains: Bearbeiten, Foto hochladen, Verschieben, Löschen (danger)

### Dashboard
- Stats cards in 2-column grid: total boxes, total items, recent activity
- Cards use `--bg-card` with standard border treatment

### Einstellungen (Settings)
- Simple list of setting rows with labels and controls
- Model picker: select input, full width within content area

## 10. Border Radius Scale

| Token | Value | Use |
|-------|-------|-----|
| `--radius-sm` | 6px | Badges, thumbnails, inline elements |
| `--radius-md` | 8px | Buttons, inputs, small containers |
| `--radius-lg` | 10px | Cards, panels, nav items |
| `--radius-xl` | 12px | Modals, large panels |

No radius larger than 12px on rectangular elements. 9999px only for pill badges if needed.

## 11. Transitions

All interactive state changes: `transition: all 0.15s ease` or individual properties at 0.15s. No animations longer than 0.3s. No spring or bounce effects.

## 12. Icons

- Icon set: Material Symbols Outlined
- Default size: 20px in nav, 18px in buttons, 24px in empty states
- Weight: 300 (light variant for clean look)
- Color: inherits from parent text color