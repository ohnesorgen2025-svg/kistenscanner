import { useEffect, useMemo, useState } from "react";

import {
  getSettings,
  listModels,
  saveActiveModel,
  saveProviderKeys,
  testModelConnection,
  type ModelSummary,
  type SettingsResponse,
} from "../lib/api";

type ProviderKeyId = keyof SettingsResponse["configuredProviders"];

const providerLabels: Record<ProviderKeyId, string> = {
  OPENAI: "OPENAI",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
  OLLAMA: "OLLAMA",
  VERTEX: "VERTEX",
};

const providerPredicates: Record<ProviderKeyId, (model: ModelSummary) => boolean> = {
  OPENAI: (model) => model.provider === "openai",
  ANTHROPIC: (model) => model.provider === "anthropic",
  GEMINI: (model) => model.provider === "google",
  OLLAMA: (model) => model.protocol === "ollama",
  VERTEX: (model) => model.protocol === "vertex",
};

const emptyProviderKeys: Record<ProviderKeyId, string> = {
  OPENAI: "",
  ANTHROPIC: "",
  GEMINI: "",
  OLLAMA: "",
  VERTEX: "",
};

export function SettingsPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [activeModelId, setActiveModelId] = useState("");
  const [configuredProviders, setConfiguredProviders] = useState<
    SettingsResponse["configuredProviders"]
  >({
    OPENAI: false,
    ANTHROPIC: false,
    GEMINI: false,
    OLLAMA: false,
    VERTEX: false,
  });
  const [providerKeys, setProviderKeys] =
    useState<Record<ProviderKeyId, string>>(emptyProviderKeys);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [isSwitchingModel, setIsSwitchingModel] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<ProviderKeyId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
          OPENAI: [],
          ANTHROPIC: [],
          GEMINI: [],
          OLLAMA: [],
          VERTEX: [],
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

  return (
    <div className="page-stack">
      <section className="panel settings-panel">
        <div className="settings-header">
          <p className="section-kicker">Systemkonfiguration</p>
          <h1>KI-Provider und Schlüssel</h1>
          <p className="panel-copy">
            Aktives Modell auswählen, Provider-Zugänge pflegen und Verbindungen direkt aus der
            Anwendung testen.
          </p>
        </div>
      </section>

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
