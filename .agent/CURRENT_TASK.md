# Current Task

## Status:
� ai-hub Integration abgeschlossen, Bildanalyse debuggen.

## Current Goal
AI-Bildanalyse mit dem über ai-hub zugewiesenen Modell (`ollama-cloud:glm-5.1`) zum Laufen bringen.

## Next Action
- Nach Redeploy (Version `ai-hub-v2`) Bildanalyse erneut testen.
- Die verbesserte Fehlermeldung zeigt jetzt den HTML-Body des Providers (erste 120 Zeichen) plus Debug-Info (providerType, modelTag, baseUrl, hasApiKey).
- Anhand der Debug-Ausgabe das eigentliche Problem identifizieren (falsche URL, Auth-Fehler, Redirect).
- Fix implementieren, pushen, Redeploy.
- Nach erfolgreichem Fix: Debug-Logging entfernen, Version-Tag aus Health-Endpoint entfernen.

## Open Questions
- Warum liefert der Ollama-Cloud-Provider HTML statt JSON zurück? (baseUrl und/oder API-Path vermutlich falsch)

## Done Recently
- Komplette ai-hub Integration (Szenario B): ai-hub-client, alle Backend-Services, Provider, Routes, Frontend Settings/Help.
- Alle lokalen Key-/Model-Management-Features entfernt (Settings-Keys, custom-models.json, Provider-Tests, .env-Handling).
- Safe JSON parsing in beiden Providern (ollama.ts, openai-compatible.ts) — zeigt jetzt HTML-Body bei Parsing-Fehlern.
- Debug-Info in analyze-images.ts Fehlerbehandlung hinzugefügt.
- Health-Endpoint mit Version-Tag (`ai-hub-v2`) zur Deploy-Verifizierung.
- Deployment auf Coolify umgestellt (kistenscanner.ohnesorgen.net).
