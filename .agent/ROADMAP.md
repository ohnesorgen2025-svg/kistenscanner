# Roadmap — kistenscanner

## Milestone 1 — Foundation ✅
- [x] Project setup (Vite + Express + SQLite)
- [x] DB schema: boxes, items, images, item_images
- [x] AI layer: build model registry, dispatcher + parser
- [x] POST /api/analyze — accepts images, returns AnalysisItem[]
- [x] Image storage + sharp crop pipeline

## Milestone 2 — Store Workflow ✅
- [x] Photo capture (camera + file upload)
- [x] AI analysis trigger + item list rendering
- [x] Per-item: title image selection, detail photo, detail field (AI pre-filled)
- [x] Box finalize: name, location, auto number, QR generation
- [x] Print label (A6, B&W, QR + top 5 items)

## Milestone 3 — Find Workflow ✅
- [x] Full-text search (name + description + detail field)
- [x] Live suggestions on keystroke
- [x] Result: item thumbnail, name, box name, number, location
- [x] Tap → box detail scrolled to item
- [x] In-app QR scan → jump to box

## Milestone 4 — Item Management ✅
- [x] Move item between boxes
- [x] Edit item inline (name, description, detail)
- [x] Multiple photos per item, select title image

## Milestone 5 — Polish ✅
- [x] AI provider switcher in settings
- [x] API key management (local storage)
- [x] Mobile UX pass
- [x] DevPilot LAN deploy
- [x] Design system consolidation (P1-P12)

## Milestone 6 — ai-hub Integration 🟡
- [x] ai-hub client (`server/src/lib/ai-hub.ts`)
- [x] Replace local model registry with ai-hub model fetching (5-min cache)
- [x] Replace local key management with ai-hub key/provider resolution
- [x] Remove Settings key inputs, provider tests, custom Ollama management
- [x] Simplify Settings page to model picker only
- [x] Update compose.yaml with AI_HUB_URL/TOKEN/APP_ID env vars
- [x] Deploy to Coolify (kistenscanner.ohnesorgen.net)
- [ ] Fix image analysis (provider returns HTML instead of JSON — debugging)
