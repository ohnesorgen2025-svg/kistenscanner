# Project Rules — kistenscanner

## Core Principle
Two workflows only: STORE and FIND. Every feature must serve one of these.

## Scope (v1)
- Single user, no auth
- Production läuft auf Coolify (online), lokales Docker Compose nur für Verifikation
- No export, no backup, no categories/tags
- No duplicate detection
- No box status system
- No dedicated dashboard route — IA besteht aus Behälter / Suchen / (Aktivität TBD); Smart-Reorganisation ist ein Werkzeug unter Settings

## Code Rules
- TypeScript everywhere (strict)
- No inline styles in components — use vanilla CSS (App.css / index.css)
- Conventional Commits
- AI core must be fully decoupled from business logic
- No provider-specific code outside src/lib/ai/providers/

## AI Layer Rules
- ai-hub is the single source of truth for all models, API keys and provider configuration
- The app fetches model assignments from ai-hub at runtime; no local model registry or hardcoded model lists
- Prompt lives in src/lib/ai/prompts/ — never inline
- Parser must handle both clean JSON and half-format fallback
- Provider adapters (ollama.ts, openai-compatible.ts) receive a `ResolvedModel` with baseUrl and apiKey from ai-hub
- No local key storage, no .env key management, no provider test endpoints in the app
- Provider dispatch is based on `providerType` from ai-hub (ollama, ollama-cloud, gemini, openai, anthropic, custom)
- No provider-specific code outside src/lib/ai/providers/

## File Structure Rules
- AI core: src/lib/ai/
- API routes: src/routes/
- DB access: src/db/
- Business logic: src/services/
- Never mix these layers

## Design System Rules
Siehe `.agent/DESIGN.md` (Stand 2026-04-30, Mockup A) für die vollständigen Regeln. Kurzfassung:
- **Layout-Shell (Desktop ≥ 1024 px)**: Sticky AppBar (44 px, Brand + Breadcrumb + ⌘K + Icon-Aktionen + Avatar) und darunter Sticky SubNav (38 px, Routen-Tabs + primäre Page-Actions). Inhalt zentriert auf max. **1240 px**, padding `0 24px`. Kein Sidebar.
- **Mobile (< 1024 px)**: AppBar/SubNav ausgeblendet, Bottom-Nav (56 px + safe-area, icons-only).
- **Color Tokens** (Quelle: `client/src/index.css`): `--bg-base #0B0D10`, `--bg-panel #111418`, `--bg-card #161A1F`, `--bg-elevated #1C2127`, `--accent #4A8DFF` (mit `-bright/-hover/-pressed/-muted`-Varianten). Keine zusätzlichen Akzentfarben.
- **Typografie**: `Inter` (400/500/600), Body 13 px, Page-Title 22 px / 600. `JetBrains Mono` (`var(--mono)`) verpflichtend für Box-IDs, Item-Codes, Standort-Pfade, Tastenkürzel und Stats-Zahlen. Section-Kicker 11 px / 600 / `letter-spacing: 0.08em`, uppercase, `--text-tertiary`.
- **Buttons**: Default Primary `var(--accent)`-Background, Ghost transparent + `--border-default`, Danger `--danger`-Text. Mindesthöhe 32 px Desktop / 40 px Mobile. BoxDetail-Toolbar nutzt horizontale Chip-Buttons mit `::after`-Labels.
- **Spacing**: 4 / 8 / 12 / 16 / 24 / 32 px. Standard-Gap zwischen Panels 16 px.
- **Border Radius Tokens**: `--radius-sm 4`, `--radius-md 6`, `--radius-lg 8`, `--radius-xl 10`. Nichts > 10 px auf rechteckigen Elementen.
- **Page-Scope-Klassen**: Jede Page-Komponente kriegt eine Wrapper-Klasse (`.boxes-page`, `.search-page`, `.box-detail-page`, `.settings-page`, `.help-page`, `.scan-page`, `.add-box-page`, `.item-detail-page`). Lokale Overrides nur scoped, niemals globale Selektoren kapern.
- **Routes / IA**: Sub-Nav-Tabs sind nur **Behälter**, **Suchen** und (disabled) **Aktivität**. Es gibt **kein `/dashboard`** mehr. Smart-Reorganisation lebt unter Settings → Werkzeuge. Settings/Help erreicht man über die AppBar-Icons.
