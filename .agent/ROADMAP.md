# Roadmap — kistenscanner

## Milestone 1 — Foundation
- [ ] Project setup (Vite + Express + SQLite)
- [ ] DB schema: boxes, items, images, item_images
- [ ] AI layer: copy models.ts + vertex adapter, build dispatcher + parser
- [ ] POST /api/analyze — accepts images, returns AnalysisItem[]
- [ ] Image storage + sharp crop pipeline

## Milestone 2 — Store Workflow
- [ ] Photo capture (camera + file upload)
- [ ] AI analysis trigger + item list rendering
- [ ] Per-item: title image selection, detail photo, detail field (AI pre-filled)
- [ ] Box finalize: name, location, auto number, QR generation
- [ ] Print label (A6, B&W, QR + top 5 items)

## Milestone 3 — Find Workflow
- [ ] Full-text search (name + description + detail field)
- [ ] Live suggestions on keystroke
- [ ] Result: item thumbnail, name, box name, number, location
- [ ] Tap → box detail scrolled to item
- [ ] In-app QR scan → jump to box

## Milestone 4 — Item Management
- [ ] Move item between boxes
- [ ] Edit item inline (name, description, detail)
- [ ] Multiple photos per item, select title image

## Milestone 5 — Polish
- [ ] AI provider switcher in settings
- [ ] API key management (local storage)
- [ ] Mobile UX pass
- [ ] DevPilot LAN deploy