export const BOX_ANALYSIS_PROMPT = `
Analyze one or more photos of a storage box and list all visible items.
Return only a JSON array.
Use best-effort identification even if an object is partially visible or ambiguous.
Do not return an empty array unless there are truly no physical objects visible.
Return all item names and descriptions in German.
Use correct German umlauts and ß where appropriate: ä, ö, ü, ß.
Never use ae, oe or ue as substitutes when a German umlaut is correct.
If the same real-world object is visible in multiple photos, return it only once.
Use the richest combined description you can infer across the photos.
Set sourceImageIndex to the photo where that object is most clearly visible.
Do not increase quantity just because the same object appears again in another photo.
Each item must contain:
- name: short item name
- description: concise identifying description
- quantity: integer count
- sourceImageIndex: zero-based index of the image the item belongs to
- bbox: object with x, y, width, height normalized between 0 and 1
`.trim();

export function buildRescanPrompt(existingItems: Array<{ name: string; description: string | null }>): string {
  const itemList = existingItems
    .map((item, i) => `  ${i + 1}. ${item.name}${item.description ? ` – ${item.description}` : ""}`)
    .join("\n");

  return `
Analyze one or more NEW photos of a storage box that already has a known inventory.
Compare what you see in the photos with the existing item list below.
Return a JSON object with three arrays: "added", "improved", "removed".

EXISTING ITEMS IN THIS BOX:
${itemList}

RULES:
- "added": Items visible in the photos that are NOT in the existing list. Use same schema as box analysis (name, description, quantity, sourceImageIndex, bbox).
- "improved": Items that ARE in the existing list but where you can provide a BETTER or MORE DETAILED description based on the new photos. Return objects with "name" (matching existing), "description" (improved text), "sourceImageIndex", "bbox".
- "removed": Items that ARE in the existing list but are clearly NOT visible in any of the new photos. Return objects with "name" only. Only list items you are fairly confident are missing.

Return all text in German with correct umlauts (ä, ö, ü, ß).
Return ONLY the JSON object, no other text.
If nothing changed, return: {"added": [], "improved": [], "removed": []}
`.trim();
}

export function buildSmartSearchPrompt(query: string, items: Array<{ id: number; name: string; description: string | null; detail: string | null; boxId: number; boxName: string; boxLocation: string }>): string {
  const itemList = items
    .map((item) => `ID:${item.id} | "${item.name}" | ${item.description ?? ""} | ${item.detail ?? ""} | Kiste #${item.boxId} "${item.boxName}" @ ${item.boxLocation}`)
    .join("\n");

  return `
A user is searching their inventory with this query: "${query}"

Here is the full inventory:
${itemList}

Return a JSON array of item IDs that match the user's search intent, ordered by relevance (best match first).
Consider synonyms, related terms, partial matches, and semantic similarity.
For example: "Ladekabel" should match "USB-C Kabel", "Kreuzschlitz" should match "Phillips-Schraubendreher".
Return at most 25 results.
Return ONLY the JSON array of numbers, e.g. [42, 17, 3].
If nothing matches, return [].
`.trim();
}

export function buildDuplicateDetectionPrompt(items: Array<{ id: number; name: string; description: string | null; boxId: number; boxName: string }>): string {
  const itemList = items
    .map((item) => `ID:${item.id} BOX:${item.boxId}("${item.boxName}") | "${item.name}" | ${item.description ?? ""}`)
    .join("\n");

  return `
Analyze this inventory for duplicate or very similar items across different boxes.
Group items that are essentially the same thing stored in different boxes.

INVENTORY:
${itemList}

Return a JSON array of duplicate groups. Each group has:
- "items": array of {id, boxId} for the duplicate items
- "reason": brief German explanation why these are duplicates

Only include groups where items are in DIFFERENT boxes.
Only include clear duplicates or very similar items (same type, similar description).
Return ONLY the JSON array. If no duplicates found, return [].
`.trim();
}

export function buildReorganizationPrompt(boxes: Array<{ id: number; number: number; name: string; location: string; items: Array<{ name: string; description: string | null }> }>): string {
  const boxList = boxes
    .map((box) => {
      const items = box.items.map((item) => `    - ${item.name}${item.description ? ` (${item.description})` : ""}`).join("\n");
      return `Kiste #${box.number} "${box.name}" @ ${box.location}:\n${items || "    (leer)"}`;
    })
    .join("\n\n");

  return `
Analyze this inventory and suggest ways to better organize it.
Look for items that might belong better in a different box based on category/theme.

CURRENT INVENTORY:
${boxList}

Return a JSON array of suggestions. Each suggestion has:
- "type": "merge" | "move" | "split"
- "description": brief German explanation of the suggestion
- "involvedBoxIds": array of box IDs involved

Only suggest changes that would clearly improve organization.
Return ONLY the JSON array. If inventory is well organized, return [].
`.trim();
}

export function buildVisualSearchPrompt(items: Array<{ id: number; name: string; description: string | null; detail: string | null }>): string {
  const itemList = items
    .map((item) => `ID:${item.id} | "${item.name}" | ${item.description ?? ""} | ${item.detail ?? ""}`)
    .join("\n");

  return `
The user photographed an object and wants to find it in their inventory.
Look at the photo and compare it with the inventory items below.
Return a JSON array of matching item IDs, ordered by confidence (best match first).

INVENTORY:
${itemList}

Match based on visual similarity to the descriptions.
Return at most 10 results.
Return ONLY the JSON array of numbers, e.g. [42, 17].
If nothing matches, return [].
`.trim();
}
