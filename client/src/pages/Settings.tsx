import { useEffect, useMemo, useState } from "react";

import {
  addCustomOllamaModel,
  getSettings,
  listModels,
  removeCustomOllamaModel,
  saveActiveModel,
  saveProviderKeys,
  testModelConnection,
  type ModelSummary,
  type SettingsResponse,
} from "../lib/api";
import { PageHeader } from "../components/PageHeader";

type ProviderKeyId = keyof SettingsResponse["configuredProviders"];

const providerLabels: Record<ProviderKeyId, string> = {
  GEMINI: "GEMINI",
  OLLAMA: "OLLAMA",
};

const providerPredicates: Record<ProviderKeyId, (model: ModelSummary) => boolean> = {
  GEMINI: (model) => model.provider === "google",
  OLLAMA: (model) => model.protocol === "ollama",
};

const emptyProviderKeys: Record<ProviderKeyId, string> = {
  GEMINI: "",
  OLLAMA: "",
};

export function SettingsPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [activeModelId, setActiveModelId] = useState("");
  const [configuredProviders, setConfiguredProviders] = useState<
    SettingsResponse["configuredProviders"]
  >({
    GEMINI: false,
    OLLAMA: false,
  });
  const [providerKeys, setProviderKeys] =
    useState<Record<ProviderKeyId, string>>(emptyProviderKeys);
  const [newOllamaModelTag, setNewOllamaModelTag] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [isSwitchingModel, setIsSwitchingModel] = useState<string | null>(null);
  const [isAddingOllamaModel, setIsAddingOllamaModel] = useState(false);
  const [removingModelId, setRemovingModelId] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<ProviderKeyId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reloadPageData(): Promise<void> {
    const [nextModels, settings] = await Promise.all([listModels(), getSettings()]);
    setModels(nextModels);
    setActiveModelId(settings.activeModelId);
    setConfiguredProviders(settings.configuredProviders);
  }

  async function reloadSettings(): Promise<void> {
    const settings = await getSettings();
    setActiveModelId(settings.activeModelId);
    setConfiguredProviders(settings.configuredProviders);
  }

  useEffect(() => {
    let isMounted = true;

    void Promise.all([listModels(), getSettings()])
      .then(([nextModels, settings]) => {
        if (!isMounted) {
          return;
        }

        setModels(nextModels);
        setActiveModelId(settings.activeModelId);
        setConfiguredProviders(settings.configuredProviders);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(
          requestError instanceof Error ? requestError.message : "Einstellungen konnten nicht geladen werden.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const modelsByProvider = useMemo(
    () =>
      (Object.keys(providerLabels) as ProviderKeyId[]).reduce<Record<ProviderKeyId, ModelSummary[]>>(
        (accumulator, providerId) => {
          accumulator[providerId] = models.filter(providerPredicates[providerId]);
          return accumulator;
        },
        {
          GEMINI: [],
          OLLAMA: [],
        },
      ),
    [models],
  );

  async function handleSelectModel(modelId: string) {
    try {
      setIsSwitchingModel(modelId);
      setError(null);
      setNotice(null);
      await saveActiveModel(modelId);
      await reloadSettings();
      setNotice("Aktives Modell gespeichert.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Modellwechsel fehlgeschlagen.",
      );
    } finally {
      setIsSwitchingModel(null);
    }
  }

  async function handleSaveKeys() {
    try {
      setIsSavingKeys(true);
      setError(null);
      setNotice(null);
      const payload = (Object.entries(providerKeys) as Array<[ProviderKeyId, string]>).reduce<
        Partial<Record<ProviderKeyId, string>>
      >((accumulator, [providerId, value]) => {
        if (value.trim().length > 0) {
          accumulator[providerId] = value;
        }

        return accumulator;
      }, {});

      const response = await saveProviderKeys(payload);
      setConfiguredProviders(response.configuredProviders);
      setNotice("Schlüssel gespeichert.");
      setProviderKeys(emptyProviderKeys);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Schlüssel konnten nicht gespeichert werden.",
      );
    } finally {
      setIsSavingKeys(false);
    }
  }

  async function handleTestProvider(providerId: ProviderKeyId) {
    const matchingModels = modelsByProvider[providerId];
    const modelToTest =
      matchingModels.find((model) => model.id === activeModelId) ?? matchingModels[0] ?? null;

    if (!modelToTest) {
      setError("Für diesen Provider ist kein Modell verfügbar.");
      return;
    }

    try {
      setTestingProvider(providerId);
      setError(null);
      setNotice(null);
      const pendingKey = providerKeys[providerId].trim();
      if (pendingKey.length > 0) {
        const response = await saveProviderKeys({ [providerId]: pendingKey });
        setConfiguredProviders(response.configuredProviders);
      }
      await testModelConnection(modelToTest.id);
      setNotice(`Test-Verbindung für ${providerLabels[providerId]} erfolgreich.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Test-Verbindung fehlgeschlagen.",
      );
    } finally {
      setTestingProvider(null);
    }
  }

  async function handleAddOllamaModel() {
    try {
      setIsAddingOllamaModel(true);
      setError(null);
      setNotice(null);
      await addCustomOllamaModel(newOllamaModelTag);
      await reloadPageData();
      setNewOllamaModelTag("");
      setNotice("Ollama-Modell hinzugefügt.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ollama-Modell konnte nicht hinzugefügt werden.",
      );
    } finally {
      setIsAddingOllamaModel(false);
    }
  }

  async function handleRemoveCustomModel(modelId: string) {
    try {
      setRemovingModelId(modelId);
      setError(null);
      setNotice(null);
      await removeCustomOllamaModel(modelId);
      await reloadPageData();
      setNotice("Ollama-Modell entfernt.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ollama-Modell konnte nicht entfernt werden.",
      );
    } finally {
      setRemovingModelId(null);
    }
  }

  const customOllamaModels = models.filter((model) => model.protocol === "ollama" && model.isCustom);

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
                <span className="settings-model-card__protocol">{model.protocol.toUpperCase()}</span>
                {isSwitchingModel === model.id ? (
                  <span className="settings-model-card__hint">Speichert…</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel settings-section">
        <div className="settings-section__header">
          <div>
            <p className="section-kicker">OLLAMA_MODELS</p>
            <h2>Ollama-Modelle hinzufügen</h2>
          </div>
        </div>

        <div className="field">
          <label htmlFor="custom-ollama-model">Ollama-Modell-Tag</label>
          <input
            className="input"
            id="custom-ollama-model"
            onChange={(event) => setNewOllamaModelTag(event.target.value)}
            placeholder="z. B. qwen3-vl:235b"
            type="text"
            value={newOllamaModelTag}
          />
        </div>

        <div className="action-row">
          <button
            className="button button--primary"
            disabled={isAddingOllamaModel || newOllamaModelTag.trim().length === 0}
            onClick={() => void handleAddOllamaModel()}
            type="button"
          >
            {isAddingOllamaModel ? "Fügt hinzu…" : "Modell hinzufügen"}
          </button>
        </div>

        {customOllamaModels.length > 0 ? (
          <div className="settings-key-list">
            {customOllamaModels.map((model) => (
              <div className="settings-key-card" key={model.id}>
                <div className="settings-key-card__topline">
                  <label>{model.name}</label>
                  <span className="settings-key-card__status settings-key-card__status--active">
                    BENUTZERDEFINIERT
                  </span>
                </div>
                <div className="action-row">
                  <button
                    className="button button--ghost"
                    disabled={removingModelId === model.id}
                    onClick={() => void handleRemoveCustomModel(model.id)}
                    type="button"
                  >
                    {removingModelId === model.id ? "Entfernt…" : "Entfernen"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="feedback">Noch keine zusätzlichen Ollama-Modelle gespeichert.</div>
        )}
      </section>

      <section className="panel settings-section">
        <div className="settings-section__header">
          <div>
            <p className="section-kicker">INTEGRATION_KEYS</p>
            <h2>API-Schlüssel</h2>
          </div>
          <button
            className="button button--ghost"
            disabled={isSavingKeys}
            onClick={() => void handleSaveKeys()}
            type="button"
          >
            {isSavingKeys ? "Speichert…" : "Speichern"}
          </button>
        </div>

        <div className="settings-key-list">
          {(Object.keys(providerLabels) as ProviderKeyId[]).map((providerId) => (
            <div className="settings-key-card" key={providerId}>
              <div className="settings-key-card__topline">
                <label htmlFor={`provider-key-${providerId}`}>{providerLabels[providerId]}_API_KEY</label>
                <span
                  className={`settings-key-card__status${
                    configuredProviders[providerId] ? " settings-key-card__status--active" : ""
                  }`}
                >
                  {configuredProviders[providerId] ? "KONFIGURIERT" : "NICHT KONFIGURIERT"}
                </span>
              </div>
              <div className="settings-key-card__controls">
                <input
                  className="input settings-key-card__input"
                  id={`provider-key-${providerId}`}
                  onChange={(event) =>
                    setProviderKeys((current) => ({
                      ...current,
                      [providerId]: event.target.value,
                    }))
                  }
                  placeholder="SCHLÜSSEL EINGEBEN..."
                  type="password"
                  value={providerKeys[providerId]}
                />
                <button
                  className="button button--ghost"
                  disabled={testingProvider === providerId}
                  onClick={() => void handleTestProvider(providerId)}
                  type="button"
                >
                  {testingProvider === providerId ? "TESTET…" : "TEST_VERBINDUNG"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="button button--primary button--wide"
          disabled={isSavingKeys}
          onClick={() => void handleSaveKeys()}
          type="button"
        >
          {isSavingKeys ? "Speichert…" : "ÄNDERUNGEN SPEICHERN"}
        </button>
      </section>
    </div>
  );
}
