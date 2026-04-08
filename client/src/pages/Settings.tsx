import { useEffect, useState } from "react";

import {
  getSettings,
  listModels,
  saveActiveModel,
  type ModelSummary,
} from "../lib/api";
import { PageHeader } from "../components/PageHeader";

export function SettingsPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [activeModelId, setActiveModelId] = useState("");
  const [isSwitchingModel, setIsSwitchingModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void Promise.all([listModels(), getSettings()])
      .then(([nextModels, settings]) => {
        if (!isMounted) return;
        setModels(nextModels);
        setActiveModelId(settings.activeModelId);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) return;
        setError(
          requestError instanceof Error ? requestError.message : "Einstellungen konnten nicht geladen werden.",
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  async function handleSelectModel(modelId: string) {
    try {
      setIsSwitchingModel(modelId);
      setError(null);
      setNotice(null);
      await saveActiveModel(modelId);
      const settings = await getSettings();
      setActiveModelId(settings.activeModelId);
      setNotice("Aktives Modell gespeichert.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Modellwechsel fehlgeschlagen.",
      );
    } finally {
      setIsSwitchingModel(null);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader kicker="Systemkonfiguration" title="Einstellungen" />

      {isLoading ? <div className="feedback">Einstellungen werden geladen…</div> : null}
      {notice ? <div className="feedback">{notice}</div> : null}
      {error ? <div className="feedback feedback--error">{error}</div> : null}

      <section className="panel settings-section">
        <div className="settings-section__header">
          <div>
            <p className="section-kicker">AI_PROVIDER</p>
            <h2>Aktives Modell</h2>
          </div>
        </div>

        {models.length === 0 && !isLoading ? (
          <div className="feedback">Keine Modelle vom AI-Hub zugewiesen.</div>
        ) : (
          <div className="settings-model-grid">
            {models.map((model) => {
              const isActive = model.id === activeModelId;

              return (
                <button
                  className={`settings-model-card${isActive ? " settings-model-card--active" : ""}`}
                  key={model.id}
                  onClick={() => void handleSelectModel(model.id)}
                  type="button"
                >
                  <span className={`settings-model-card__state${isActive ? " settings-model-card__state--active" : ""}`}>
                    {isActive ? "ACTIVE" : "STANDBY"}
                  </span>
                  <span className="settings-model-card__provider">
                    {model.provider.replace(/-/g, " ").toUpperCase()}
                  </span>
                  <span className="settings-model-card__name">{model.name}</span>
                  {isSwitchingModel === model.id ? (
                    <span className="settings-model-card__hint">Speichert…</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
