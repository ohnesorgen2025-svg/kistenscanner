# Current Task

## Status:
🟢 Zusätzliche Ollama-Modelle lassen sich jetzt direkt in der App anlegen und entfernen.

## Current Goal
Die KI-Konfiguration bewusst einfach und flexibel halten: direkter Ollama-Zugang per API-Key, zusätzliche Ollama-Tags ohne Codeänderung, Gemini AI Studio als Fallback.

## Next Action
- Reale Modelltests für Ollama und Gemini aus der Settings-Seite und den Analyse-Flows durchführen.
- Mit echten Ollama-Library-Tags prüfen, welche zusätzlichen Modelle in der Praxis aufgenommen werden sollen.
- Prüfen, welche Ollama-Modelle über den direkten Online-Zugang im Alltag stabil und wirtschaftlich genug sind.
- Danach nächste Feature-Arbeit oder Review-Zyklus nach User-Feedback.

## Open Questions
- Keine.

## Done Recently
- Zusätzliche Ollama-Modelle können jetzt über die Settings-Seite per Modell-Tag gespeichert und wieder entfernt werden.
- Benutzerdefinierte Ollama-Modelle werden in `data/custom-models.json` persistiert und zusammen mit den eingebauten Modellen über `/api/models` ausgeliefert.
- Settings-Provider-Test auf textbasierten Ping umgestellt, damit direkter Ollama-Zugang nicht mehr am Testbild scheitert.
- Veraltete Ollama-Cloud-Modellnamen korrigiert (`qwen3.5:397b`, `qwen3-vl:235b`, `glm-4.6`) und das lokale 9B-Modell aus der aktiven Online-Liste entfernt.
- Ollama-Modelle von der festen LAN-IP auf direkten Zugriff gegen `https://ollama.com/api` umgestellt.
- Einheitlichen `OLLAMA_API_KEY` eingeführt und Legacy-Werte (`OLLAMA_CLOUD_API_KEY`, `GLM_API_KEY`) als Übergangsmigration abgefangen.
- Hilfe- und Settings-Referenzen auf den direkten Ollama-Key-Pfad aktualisiert.
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
