# Design System: Kistenscanner

> **Stand 2026-04-30** — Visuelles Redesign nach Mockup A („Tool / Engineering"-Ästhetik).
> Frühere Iterationen (Linear/Apple-Blue, Top-Bar 48px icons-only) sind abgelöst und nicht mehr maßgeblich. Quelle der Wahrheit ist `client/src/index.css` + `client/src/App.css`.

## 1. Visual Direction

Kistenscanner ist ein Inventar-Werkzeug, kein Konsumentenprodukt. Die Oberfläche soll wie ein präzises Werkzeug wirken: ruhig, technisch, mit klar lesbaren IDs/Codes. Dunkel ist Standard. Akzentfarbe ist ein gedämpftes Blau, JetBrains Mono macht alle technischen Zeichen (Box-#, Item-Codes, Tastenkürzel) sofort als „Daten" lesbar.

Layout-Idee: oben eine schmale **AppBar** (Brand · Breadcrumb · ⌘K · Icon-Aktionen · Avatar), darunter eine **SubNav** mit Routen-Tabs und rechts den primären Aktionen (Scan, +Behälter). Beide sticky. Inhalt zentriert auf max. **1240 px**, mobile bleibt einspaltig mit Bottom-Nav.

## 2. Color Tokens

Definiert in `client/src/index.css`.

### Surfaces (4-Stufen-Stack)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-base` | `#0B0D10` | Page-Canvas |
| `--bg-panel` | `#111418` | AppBar, Karten-Header, Modale, Bottom-Nav |
| `--bg-card` | `#161A1F` | Panels, Listenkarten, Inputs |
| `--bg-elevated` | `#1C2127` | Hover, Popover, Dropdowns |

### Text (4-Stufen-Hierarchie)

| Token | Hex |
|-------|-----|
| `--text-primary` | `#E6E8EB` |
| `--text-secondary` | `#9097A0` |
| `--text-tertiary` | `#6E747F` |
| `--text-quaternary` | `#5F6770` |

### Accent

| Token | Hex |
|-------|-----|
| `--accent` | `#4A8DFF` |
| `--accent-bright` | `#6EA8FF` |
| `--accent-hover` | `#5C99FF` |
| `--accent-pressed` | `#3877E5` |
| `--accent-muted` | `rgba(74,141,255,0.10)` |

### Status

| Token | Hex |
|-------|-----|
| `--success` | `#4ADE80` |
| `--warning` | `#FB923C` |
| `--danger` | `#F87171` |

### Borders

| Token | Wert |
|-------|------|
| `--border-subtle` | `rgba(255,255,255,0.06)` |
| `--border-default` | `rgba(255,255,255,0.10)` |
| `--border-strong` | `rgba(255,255,255,0.16)` |

## 3. Typography

- **Sans**: `Inter` (400/500/600), Standard 13 px, Body 12.5 px, Subtext 11.5 px, Page-Title 22 px / 600 / -0.015em.
- **Mono**: `JetBrains Mono` (`var(--mono)`) — verpflichtend für: Box-IDs (`#1234`), Item-Codes, Standort-Pfade in der Breadcrumb, Tastenkürzel-Chips (`⌘K`), Stats-Zahlen.
- **Section-Kicker**: 11 px / 600 / `letter-spacing: 0.08em`, `--text-tertiary`, immer `text-transform: uppercase`. Klasse `.section-kicker`.
- Keine Schriftgröße unter 11 px, kein Gewicht über 600.

## 4. Layout Shell

Komponenten in `client/src/App.tsx`:

### AppBar (Desktop, ≥ 1024 px)

- Sticky, `top: 0`, `z-index: 50`, Höhe **44 px**, Hintergrund `--bg-panel`.
- 3-Spalten-Grid `1fr auto 1fr`, max-width **1240 px**, padding `0 24px`.
- Links: Brand-Mark (24×24, Gradient) + Breadcrumb in Mono.
- Mitte: `.cmdk` Button (`⌘K`), öffnet Suche.
- Rechts: Icon-Aktionen (Add, Scan, Help, Settings) à 28×28 + Avatar.

### SubNav (Desktop, ≥ 1024 px)

- Sticky, `top: 44px`, Höhe **38 px**, Hintergrund `--bg-base`, untere `border-subtle`.
- Tabs links (Behälter, Suchen, Aktivität — letzteres derzeit `disabled`).
- Rechts: primäre Page-Actions als Pills (Scan, +Behälter).

### MobileBottomNav (< 1024 px)

- Sticky bottom, 56 px + safe-area, `bg-panel`.
- Icons-only, max 5 Items.
- Aktiver Tab: `accent-bright` Farbe + `accent-muted` Hintergrund.

### Page Shell

```
.page-shell--app           // alle App-Routen, max-width 1240px
.page-shell--detail        // BoxDetail/ItemDetail
.page-stack--route         // vertikales Stack der Sektionen, gap 16px
```

Jede Page hat eine Scope-Klasse (`.boxes-page`, `.search-page`, `.box-detail-page`, `.settings-page`, `.help-page`, `.scan-page`, `.add-box-page`, `.item-detail-page`) auf dem äußeren Wrapper für lokale Overrides.

## 5. Components

### Panel

```
.panel { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
```

### Buttons

| Klasse | Look |
|--------|------|
| `.button` (default Primary) | `bg: --accent`, `color: white`, `radius: --radius-md` (6px), Höhe 32 px |
| `.button.button--ghost` | `bg: transparent`, `border: 1px solid --border-default`, hover füllt mit `bg-elevated` |
| `.button.button--danger` | Text in `--danger`, dezent transparenter Hintergrund |

Mindesthöhe interaktiv: **32 px Desktop / 40 px Mobile**.
Toolbar-Aktionen (BoxDetail) sind horizontale Chip-Buttons mit `::after`-Label (Bearbeiten, Foto, Label, Teilen, Zurück, Löschen).

### Chips (`.chip`)

- 11.5 px, mono für Codes, `bg: --bg-elevated`, Border `--border-subtle`, radius 4 px.
- Varianten: `.chip--accent`, `.chip--success`, `.chip--warning`, `.chip--danger`, `.chip--move`, `.chip--merge`, `.chip--split`, `.chip--neutral`.

### Inputs

- `bg: rgba(255,255,255,0.03)`, Border `--border-default`, Radius 6 px, Höhe 32 px Desktop.
- Focus: Border `--accent`, `box-shadow: 0 0 0 3px var(--accent-muted)`.

### Cards

- BoxCard: Bild oben (Aspect-Ratio 4:3), darunter Header mit Box-# (mono), Name, Standort, Item-Count.
- Suggestion-Card: kleine Karte mit `chip--{type}` + Beschreibung.

### Filter-Chips (Boxes)

`.filters` Reihe mit Chip-Buttons. Aktiver Filter: `bg: --accent-muted`, `color: --accent-bright`, Border `--accent`.

## 6. Routes & IA

| Route | Tab in SubNav | Page-Class |
|-------|---------------|------------|
| `/boxes`, `/boxes/add` | Behälter | `.boxes-page`, `.add-box-page` |
| `/boxes/:id` | (Detail) | `.box-detail-page` |
| `/items/:id` | (Detail) | `.item-detail-page` |
| `/` (Suche) | Suchen | `.search-page` |
| `/scan` | (Action) | `.scan-page` |
| `/settings` | (AppBar-Icon) | `.settings-page` |
| `/help` | (AppBar-Icon) | `.help-page` |

Aktivität-Tab ist sichtbar, aber `disabled` — wird in einer späteren Phase verdrahtet.
**Kein `/dashboard`** — abgeschafft am 2026-04-30. Smart-Reorganisation lebt jetzt unter Settings → „Werkzeuge". Loans laufen über Box- und Item-Detail.

## 7. Spacing / Radius

- Spacing: 4 / 8 / 12 / 16 / 24 / 32 px. Standard-Gap zwischen Panels = 16 px.
- Radius-Tokens: `--radius-sm 4`, `--radius-md 6`, `--radius-lg 8`, `--radius-xl 10`. Nichts >10 px.

## 8. Do / Don't

**Do**
- Inter + JetBrains Mono konsequent — Mono für alles, was wie ein Identifier aussieht.
- Eine Akzentfarbe (`#4A8DFF`). Status-Farben nur für Status.
- Page-Scope-Klasse anlegen, statt globale Selektoren zu kapern.
- Sticky AppBar + SubNav nicht mit weiteren sticky Elementen oben überlagern.
- Max. zwei sichtbare Aktionen pro Karte; weiteres in Kontextmenü oder Detail.

**Don't**
- Kein reines Weiß. Kein Gewicht > 600.
- Keine Drop-Shadows auf Karten — Tiefe entsteht durch `bg-card` ↔ `bg-base`.
- Keine zusätzlichen Akzentfarben einführen.
- Keine breiten Container über 1240 px.
- Keine Stat-Kacheln-Wand auf Listen-Seiten — Inventar ist die Hauptansicht.

## 9. Outstanding (Phase 2)

- Echte Standort-Filter auf `/boxes` (derzeit nur Demo-Chips).
- Sortierung im List-View (Letzte Änderung / Items / Name).
- ⌘K-Palette mit Quick-Find statt simpler Routen-Wechsel.
- Aktivität-Tab funktional anbinden (Audit-Log oder Recent-Activity).
- Optional: „Verliehen"-Filter-Chip auf `/boxes`, falls Loans-Nutzung steigt.
