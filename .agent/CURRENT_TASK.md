# Current Task

## Status:
🟢 KI-Provider-Bereinigung abgeschlossen. Aktive Modelloberfläche auf Ollama + Gemini AI Studio reduziert.

## Current Goal
Die KI-Konfiguration bewusst einfach und testbar halten: Ollama für lokale Experimente, Gemini AI Studio als externer Fallback.

## Next Action
- Reale Modelltests für Ollama und Gemini aus der Settings-Seite und den Analyse-Flows durchführen.
- Danach nächste Feature-Arbeit oder Review-Zyklus nach User-Feedback.

## Open Questions
- Keine.

## Done Recently
- OpenAI, Anthropic und Vertex vollständig aus aktiver Modellliste, Settings-UI und Settings-Backend entfernt.
- Unbenutzte Anthropic-/Vertex-Provider-Dateien gelöscht, Dispatcher auf Ollama + openai-compatible (für Gemini) reduziert.
- Stack-, Rules- und Design-Referenz auf die neue Provider-Reduktion angepasst.
- P1: 3 Blautöne auf einheitliches `--accent` (#3B82F6) vereinheitlicht
- P2: `.button:active` State für Touch-Feedback ergänzt
- P3: Input/Textarea min-height 44px → 48px
- P4: Nav-Link Touch-Target 44px → 48px
- P5: 12+ border-radius Werte auf 3 Tokens konsolidiert (4/8/12px)
- P6: 19 font-sizes auf 5-Stufen Type-Scale konsolidiert
- P7: Fehlende :active States auf 6 interaktiven Elementen ergänzt
- P8: .image-thumb Hover/Active ergänzt
- P9: Spacing auf 12px-Grid normalisiert
- P10: 8 letter-spacing Werte auf 2 standardisiert
- P12: !important Overrides entfernt
- PROJECT_RULES.md mit allen Design-Tokens aktualisiert
