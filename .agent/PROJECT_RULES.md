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
- Current active provider scope: Ollama + Gemini AI Studio only
- Gemini uses the openai-compatible adapter internally; no OpenAI, Anthropic or Vertex models stay in active config

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
- **Button Dimensions**: Minimum height of `48px` for all buttons and interactive touch targets. Toolbar icon buttons must be exactly `48x48px` squares and must NOT stretch.
- **Button Styles**: 
  - `Primary`: `var(--accent)` (`#3B82F6`) background, white text, no border.
  - `Secondary/Ghost`: Transparent background, `1.5px solid rgba(255,255,255,0.3)` border.
  - All buttons and interactive elements must have `:hover` and `:active` states.
- **Color**: Single accent color `--accent: #3B82F6`. All accent-derived values use `rgba(59, 130, 246, <opacity>)`. No hardcoded hex blues.
- **Spacing/Density**: Professional dashboard aesthetic with `12px` gaps as base multiplier. Valid values: 6px (0.375rem), 12px (0.75rem), 24px (1.5rem), 36px (2.25rem), 48px (3rem).
- **Content Width**: Maximum width for centered content should be strictly bounded to `768px` (48rem).
- **Border Radius**: 3 tokens only — `0.25rem` (4px, chips/badges), `0.5rem` (8px, buttons/inputs), `0.75rem` (12px, panels/cards).
- **Font Sizes**: 5-step type scale — `0.7rem` (xs), `0.75rem` (sm), `0.85rem` (base), `0.95rem` (md), `1.05rem` (lg). Headings use `clamp()`.
- **Letter Spacing**: 2 values only — `0.08em` (normal) and `0.12em` (wide/uppercase labels).
