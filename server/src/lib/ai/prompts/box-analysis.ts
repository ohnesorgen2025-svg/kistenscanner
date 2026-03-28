export const BOX_ANALYSIS_PROMPT = `
Analyze one or more photos of a storage box and list all visible items.
Return only a JSON array.
Use best-effort identification even if an object is partially visible or ambiguous.
Do not return an empty array unless there are truly no physical objects visible.
Each item must contain:
- name: short item name
- description: concise identifying description
- quantity: integer count
- sourceImageIndex: zero-based index of the image the item belongs to
- bbox: object with x, y, width, height normalized between 0 and 1
`.trim();
