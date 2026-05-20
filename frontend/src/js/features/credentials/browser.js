import { $ } from "../../dom.js";
import {
  API_PREFIX,
  DEFAULT_MODEL_VERSION,
} from "../../constants.js";

export function mountBrowserCredentialsFeature({
  state,
  applyKeyInputs,
  defaultMineruToken,
  defaultModelApiKey,
  defaultModelBaseUrl,
  getTaskOptions,
  saveTaskOptions,
  saveBrowserStoredConfig,
  saveDesktopConfig,
  checkApiConnectivity,
  validateMineruToken,
  onCredentialStateChange,
}) {
  function credentialDialog() {
    return $("browser-credentials-dialog");
  }

  function activateCredentialTab(tabName = "api") {
    const dialog = credentialDialog();
    if (!dialog) {
      return;
    }
    dialog.querySelectorAll("[data-credential-tab]").forEach((tab) => {
      const active = tab.dataset.credentialTab === tabName;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    dialog.querySelectorAll("[data-credential-panel]").forEach((panel) => {
      const active = panel.dataset.credentialPanel === tabName;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  }

  function setMineruValidationMessage(message, tone = "") {
    const el = $("browser-mineru-validation");
    if (!el) {
      return;
    }
    const content = `${message || ""}`.trim();
    el.textContent = content || "保存前に MinerU Token を自動検証します。";
    el.classList.toggle("hidden", !content);
    el.classList.toggle("is-valid", tone === "valid");
    el.classList.toggle("is-error", tone === "error");
  }

  function setDeepSeekValidationMessage(message, tone = "") {
    const el = $("browser-deepseek-validation");
    if (!el) {
      return;
    }
    const content = `${message || ""}`.trim();
    el.textContent = content || "DeepSeek API の接続を検証できます。";
    el.classList.toggle("hidden", !content);
    el.classList.toggle("is-valid", tone === "valid");
    el.classList.toggle("is-error", tone === "error");
  }

  function resetMineruValidationCache() {
    state.validatedMineruToken = "";
    state.mineruValidationStatus = "";
  }

  async function runMineruTokenValidation(token, { showResult = true } = {}) {
    const mineruToken = `${token || ""}`.trim();
    if (!mineruToken) {
      resetMineruValidationCache();
      if (showResult) {
        setMineruValidationMessage("先に MinerU Token を入力してください。", "error");
      }
      return { ok: false, status: "unauthorized" };
    }
    if (showResult) {
      setMineruValidationMessage("MinerU Token を検証しています…");
    }
    try {
      const result = await validateMineruToken(API_PREFIX, {
        mineru_token: mineruToken,
        base_url: "https://mineru.net",
        model_version: DEFAULT_MODEL_VERSION,
      });
      state.validatedMineruToken = mineruToken;
      state.mineruValidationStatus = result.status || "";
      if (showResult) {
        const hint = result.operator_hint ? ` ${result.operator_hint}` : "";
        const message = result.summary || `MinerU Token 検証結果：${result.status || "unknown"}`;
        setMineruValidationMessage(`${message}${hint}`.trim(), result.ok ? "valid" : "error");
      }
      return result;
    } catch (_err) {
      resetMineruValidationCache();
      if (showResult) {
        setMineruValidationMessage("MinerU Token の検証に失敗しました。しばらくしてから再試行してください。", "error");
      }
      return {
        ok: false,
        status: "network_error",
        summary: "MinerU Token の検証に失敗しました。しばらくしてから再試行してください。",
      };
    }
  }

  async function runDeepSeekConnectivityCheck(apiKey, { showResult = true } = {}) {
    const modelApiKey = `${apiKey || ""}`.trim();
    if (!modelApiKey) {
      if (showResult) {
        setDeepSeekValidationMessage("先に DeepSeek Key を入力してください。", "error");
      }
      return { ok: false, status: 0 };
    }
    if (showResult) {
      setDeepSeekValidationMessage("DeepSeek API を検証しています…");
    }
    const baseUrl = defaultModelBaseUrl().replace(/\/$/, "");
    try {
      const resp = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${modelApiKey}`,
        },
      });
      if (resp.ok) {
        if (showResult) {
          setDeepSeekValidationMessage("DeepSeek API に接続できました。", "valid");
        }
        return { ok: true, status: resp.status };
      }
      const summary = resp.status === 401
        ? "DeepSeek Key が無効か期限切れです。"
        : `DeepSeek API が ${resp.status} を返しました。`;
      if (showResult) {
        setDeepSeekValidationMessage(summary, "error");
      }
      return { ok: false, status: resp.status, summary };
    } catch (_err) {
      if (showResult) {
        setDeepSeekValidationMessage("DeepSeek API の検証に失敗しました。ネットワークまたはブラウザの CORS 制限を確認してください。", "error");
      }
      return { ok: false, status: 0 };
    }
  }

  function browserCredentialElements() {
    return {
      dialog: $("browser-credentials-dialog"),
      mineruInput: $("browser-mineru-token"),
      apiKeyInput: $("browser-api-key"),
      mathModeSelect: $("browser-job-math-mode"),
      translateTitlesInput: $("browser-translate-titles"),
      trigger: $("credentials-btn"),
    };
  }

  function syncBrowserDialogFromHiddenInputs() {
    const {
      mineruInput,
      apiKeyInput,
      mathModeSelect,
      translateTitlesInput,
    } = browserCredentialElements();
    const taskOptions = getTaskOptions?.() || {};
    if (mineruInput) {
      mineruInput.value = $("mineru_token").value || "";
    }
    if (apiKeyInput) {
      apiKeyInput.value = $("api_key").value || "";
    }
    if (mathModeSelect) {
      mathModeSelect.value = taskOptions.mathMode === "placeholder" ? "placeholder" : "direct_typst";
    }
    if (translateTitlesInput) {
      translateTitlesInput.checked = taskOptions.translateTitles !== false;
    }
    setMineruValidationMessage("", "");
    setDeepSeekValidationMessage("", "");
  }

  function persistBrowserCredentialsFromDialog() {
    const {
      mineruInput,
      apiKeyInput,
      mathModeSelect,
      translateTitlesInput,
    } = browserCredentialElements();
    applyKeyInputs(
      mineruInput?.value?.trim() || "",
      apiKeyInput?.value?.trim() || "",
    );
    saveTaskOptions?.({
      mathMode: mathModeSelect?.value || "direct_typst",
      translateTitles: !!translateTitlesInput?.checked,
    });
    saveBrowserStoredConfig();
  }

  async function persistDesktopCredentialsFromDialog() {
    const {
      mineruInput,
      apiKeyInput,
      mathModeSelect,
      translateTitlesInput,
    } = browserCredentialElements();
    const mineruToken = mineruInput?.value?.trim() || "";
    const modelApiKey = apiKeyInput?.value?.trim() || "";
    await saveDesktopConfig?.(
      mineruToken,
      modelApiKey,
      async () => {
        await checkApiConnectivity?.();
      },
    );
    applyKeyInputs(mineruToken, modelApiKey);
    saveTaskOptions?.({
      mathMode: mathModeSelect?.value || "direct_typst",
      translateTitles: !!translateTitlesInput?.checked,
    });
  }

  function hasBrowserCredentials() {
    return Boolean(($("mineru_token").value || "").trim() && ($("api_key").value || "").trim());
  }

  function openBrowserCredentialsDialog() {
    const { dialog } = browserCredentialElements();
    if (!dialog) {
      return;
    }
    syncBrowserDialogFromHiddenInputs();
    activateCredentialTab("api");
    dialog.showModal();
  }

  async function ensureMineruTokenReady({ onMissingToken, onInvalidToken } = {}) {
    const token = ($("mineru_token").value || defaultMineruToken()).trim();
    if (!token) {
      onMissingToken?.();
      setMineruValidationMessage("先に MinerU Token を入力してください。", "error");
      return false;
    }
    if (state.validatedMineruToken === token && state.mineruValidationStatus === "valid") {
      return true;
    }
    const result = await runMineruTokenValidation(token, { showResult: !state.desktopMode });
    if (result.ok) {
      return true;
    }
    onInvalidToken?.(result);
    return false;
  }

  function updateCredentialGate({
    workflowNeedsCredentials,
    workflowNeedsUpload,
    refreshSubmitControls,
  }) {
    const trigger = $("credentials-btn");
    const gate = $("credential-gate");
    const tile = $("file")?.closest(".upload-tile");
    const fileInput = $("file");
    const uploadGlyph = $("upload-glyph");
    const fileLabel = $("file-label");
    const uploadHelp = $("upload-help");
    const uploadMeta = document.querySelector(".upload-meta");
    const uploadStatus = $("upload-status");

    if (!gate || !tile || !fileInput) {
      return;
    }
    const uploadEnabled = workflowNeedsUpload();
    if (state.desktopMode) {
      gate.classList.add("hidden");
      trigger?.classList.remove("is-nudged");
      tile.classList.toggle("is-locked", !uploadEnabled);
      fileInput.disabled = !uploadEnabled;
      uploadGlyph?.classList.toggle("hidden", !uploadEnabled);
      uploadMeta?.classList.toggle("hidden", !uploadEnabled);
      tile.classList.toggle("is-ready", uploadEnabled && !!state.uploadId);
      refreshSubmitControls();
      return;
    }
    const show = workflowNeedsCredentials() && !hasBrowserCredentials();
    gate.classList.toggle("hidden", !show);
    trigger?.classList.toggle("is-nudged", show);
    tile.classList.toggle("is-locked", show || !uploadEnabled);
    fileInput.disabled = show || !uploadEnabled;
    uploadGlyph?.classList.toggle("hidden", show || !uploadEnabled);
    fileLabel?.classList.toggle("hidden", show);
    uploadHelp?.classList.toggle("hidden", false);
    uploadMeta?.classList.toggle("hidden", show || !uploadEnabled);
    if (show) {
      uploadStatus?.classList.add("hidden");
    }
    refreshSubmitControls();
    tile.classList.toggle("is-ready", !show && uploadEnabled && !!state.uploadId);
  }

  async function handleBrowserMineruValidate() {
    const { mineruInput } = browserCredentialElements();
    await runMineruTokenValidation(mineruInput?.value || "", { showResult: true });
  }

  async function handleBrowserDeepSeekValidate() {
    const { apiKeyInput } = browserCredentialElements();
    await runDeepSeekConnectivityCheck(apiKeyInput?.value || "", { showResult: true });
  }

  async function handleBrowserCredentialSave() {
    const { mineruInput, apiKeyInput } = browserCredentialElements();
    const mineruToken = mineruInput?.value?.trim() || "";
    const modelApiKey = apiKeyInput?.value?.trim() || "";
    if (!mineruToken || !modelApiKey) {
      if (!mineruToken) {
        setMineruValidationMessage("先に MinerU Token を入力してください。", "error");
      }
      if (!modelApiKey) {
        setDeepSeekValidationMessage("先に DeepSeek Key を入力してください。", "error");
      }
      return;
    }
    const validation = await runMineruTokenValidation(mineruInput?.value || "", { showResult: true });
    if (!validation.ok) {
      return;
    }
    try {
      if (state.desktopMode) {
        await persistDesktopCredentialsFromDialog();
      } else {
        persistBrowserCredentialsFromDialog();
      }
    } catch (error) {
      setDeepSeekValidationMessage(error?.message || String(error), "error");
      return;
    }
    onCredentialStateChange?.();
    $("browser-credentials-dialog")?.close();
  }

  $("browser-mineru-token")?.addEventListener("input", () => {
    resetMineruValidationCache();
    setMineruValidationMessage("", "");
  });
  $("browser-api-key")?.addEventListener("input", () => {
    setDeepSeekValidationMessage("", "");
  });
  $("browser-mineru-validate-btn")?.addEventListener("click", handleBrowserMineruValidate);
  $("browser-deepseek-validate-btn")?.addEventListener("click", handleBrowserDeepSeekValidate);
  $("browser-credentials-save-btn")?.addEventListener("click", handleBrowserCredentialSave);
  $("credentials-btn")?.addEventListener("click", openBrowserCredentialsDialog);
  credentialDialog()?.querySelectorAll("[data-credential-tab]").forEach((tab) => {
      tab.addEventListener("click", () => {
        activateCredentialTab(tab.dataset.credentialTab || "api");
      });
    });

  return {
    activateCredentialTab,
    ensureMineruTokenReady,
    hasBrowserCredentials,
    openBrowserCredentialsDialog,
    updateCredentialGate,
  };
}
