# Project Rules — kistenscanner

## Core Principle
Two workflows only: STORE and FIND. Every feature must serve one of these.

## Scope (v1)
- Single user, no auth
- Local LAN deployment via DevPilot
- No export, no backup, no categories/tags
- No duplicate detection
- No box status system

## Code Rules
- TypeScript everywhere (strict)
- No inline styles in components — use CSS modules or Tailwind
- Conventional Commits
- AI core must be fully decoupled from business logic
- No provider-specific code outside src/lib/ai/providers/

## AI Layer Rules
- models.ts is the single source of truth for all models/providers
- Prompt lives in src/lib/ai/prompts/ — never inline
- Parser must handle both clean JSON and half-format fallback
- Vertex adapter: copy from inventarisierung project (OAuth2 complexity)
- models.ts + API keys: copy from inventarisierung project

## File Structure Rules
- AI core: src/lib/ai/
- API routes: src/routes/
- DB access: src/db/
- Business logic: src/services/
- Never mix these layers

## Design System Rules
- **Navigation**: Mobile is a single-row bottom bar with icons only (no text). Desktop is a left sidebar with text.
- **Button Symmetry**: 
  - 1 Action Button = 100% container width.
  - 2 Action Buttons = 50% / 50% width (`flex: 1`).
  - 3 Action Buttons = 33/33/33 or 2x50% above 1x100%.
- **Button Dimensions**: Minimum height of `48px` for all buttons. Toolbar icon buttons must be exactly `48x48px` squares and must NOT stretch.
- **Button Styles**: 
  - `Primary`: `#378ADD` background, white text, no border.
  - `Secondary/Ghost`: Transparent background, `1.5px solid rgba(255,255,255,0.3)` border.
- **Spacing/Density**: Professional dashboard aesthetic with `12px` gaps as base multiplier.
- **Content Width**: Maximum width for centered content should be strictly bounded to `768px`.