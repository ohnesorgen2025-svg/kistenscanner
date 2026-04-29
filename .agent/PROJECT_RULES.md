# Project Rules — kistenscanner

## Core Principle
Two workflows only: STORE and FIND. Every feature must serve one of these.

## Scope (v1)
- Single user, no auth
- Local Docker Compose verification plus shared LAN deployment
- No export, no backup, no categories/tags
- No duplicate detection
- No box status system

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
- **Navigation**: Mobile is a single-row bottom bar with icons only (no text). Desktop is a fixed top bar with icons only (no text), full width, height `48px`, centered horizontal icons, and no left sidebar.
- **Desktop Content Offset**: Desktop content must use `margin-left: 0` and `padding-top: 64px` (`48px` top bar + `16px` spacing). Never reserve `72px` for a sidebar.
- **Button Symmetry**: 
  - 1 Action Button = 100% container width.
  - 2 Action Buttons = 50% / 50% width (`flex: 1`).
  - 3 Action Buttons = 33/33/33 or 2x50% above 1x100%.
- **Button Dimensions**: Minimum height of `40px` for all buttons and interactive touch targets. Toolbar icon buttons must be exactly `40x40px` squares and must NOT stretch.
- **Button Styles**: 
  - `Primary`: `var(--accent)` (`#0071e3`) background, `var(--text-primary)` text, no border.
  - `Secondary/Ghost`: Transparent background, `1.5px solid rgba(255,255,255,0.3)` border.
  - All buttons and interactive elements must have `:hover` and `:active` states.
- **Color**: Single accent color `--accent: #0071e3`, with `--accent-bright: #2997ff`, `--accent-hover: #0077ed`, `--accent-pressed: #005bb5`, and `--accent-muted: rgba(0,113,227,0.12)`. No hardcoded legacy blues.
- **Spacing/Density**: Professional dashboard aesthetic with `12px` gaps as base multiplier. Valid values: 6px (0.375rem), 12px (0.75rem), 24px (1.5rem), 36px (2.25rem), 48px (3rem).
- **Content Width**: Responsive, not a single fixed cap.
  - Tablet (≥ 768px / 48rem): max `640px`, centered
  - Desktop (≥ 1024px / 64rem): max `720px` app / `840px` detail
  - Large Desktop (≥ 1280px / 80rem): max `800px` app / `960px` detail
  - Note: `page-shell--detail` (BoxDetail, ItemDetail) always gets more width than `page-shell--app` routes.
- **Border Radius**: 4 tokens only — `6px`, `8px`, `10px`, `12px`.
- **Font Sizes**: Use the design-system scale from `.agent/DESIGN.md`; page titles are `24px`, section kickers `11px`, body text `14px`. No font size below `11px`.
- **Font Weight**: No weight above `600`.
- **Letter Spacing**: Use `0.08em` for uppercase section labels and subtle negative spacing only where specified in `.agent/DESIGN.md`.
