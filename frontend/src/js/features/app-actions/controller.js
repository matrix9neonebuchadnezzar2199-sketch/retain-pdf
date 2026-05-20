import { $ } from "../../dom.js";

export function mountAppActionsFeature({
  state,
  apiBase,
  apiPrefix,
  isMockMode,
  openSetupDialog,
  renderJob,
  setText,
  submitJson,
  saveDesktopConfig,
  setDesktopBusy,
  desktopInvoke,
  currentWorkflow,
  workflowNeedsCredentials,
  workflowNeedsUpload,
  currentRenderSourceJobId,
  collectRunPayload,
  getBrowserCredentialsFeature,
  getJobRuntimeFeature,
  onDesktopConfigSaved,
}) {
  async function submitForm(event) {
    event.preventDefault();
    const workflow = currentWorkflow();
    if (isMockMode()) {
      $("submit-btn").disabled = true;
      setText("error-box", "-");
      try {
        const payload = await submitJson(`${apiBase()}${apiPrefix}/jobs`, { workflow, mock: true });
        state.currentJobStartedAt = new Date().toISOString();
        state.currentJobFinishedAt = "";
        renderJob(payload);
        getJobRuntimeFeature()?.startPolling(payload.job_id);
      } catch (err) {
        setText("error-box", err.message);
      } finally {
        $("submit-btn").disabled = false;
      }
      return;
    }
    if (state.desktopMode && !state.desktopConfigured && workflowNeedsCredentials(workflow)) {
      openSetupDialog();
      setText("error-box", "先に初回設定を完了してください。");
      return;
    }
    if (workflowNeedsUpload(workflow) && !state.uploadId) {
      setText("error-box", "先に PDF ファイルを選択してアップロードしてください");
      return;
    }
    if (!workflowNeedsUpload(workflow) && !currentRenderSourceJobId()) {
      setText("error-box", "先に開発者設定で Render ソース Job ID を入力してください。");
      return;
    }
    if (workflowNeedsCredentials(workflow) && !(await getBrowserCredentialsFeature()?.ensureMineruTokenReady({
      onMissingToken: () => {
        setText("error-box", "先に MinerU Token を入力してください。");
        if (!state.desktopMode) {
          getBrowserCredentialsFeature()?.openBrowserCredentialsDialog();
        }
      },
      onInvalidToken: (result) => {
        setText("error-box", result.summary || "MinerU Token の検証に合格しませんでした。");
        if (!state.desktopMode) {
          getBrowserCredentialsFeature()?.openBrowserCredentialsDialog();
        }
      },
    }))) {
      return;
    }

    $("submit-btn").disabled = true;
    setText("error-box", "-");

    try {
      const runPayload = collectRunPayload();
      const payload = await submitJson(`${apiBase()}${apiPrefix}/jobs`, runPayload);
      state.currentJobStartedAt = new Date().toISOString();
      state.currentJobFinishedAt = "";
      renderJob(payload);
      getJobRuntimeFeature()?.startPolling(payload.job_id);
    } catch (err) {
      setText("error-box", err.message);
    } finally {
      $("submit-btn").disabled = false;
    }
  }

  async function checkApiConnectivity() {
    try {
      const resp = await fetch(`${apiBase()}/health`);
      if (!resp.ok) {
        throw new Error(`health ${resp.status}`);
      }
    } catch (_err) {
      setText("error-box", `フロントエンドがバックエンドに接続できません。API Base: ${apiBase()}。ローカルサービスが起動しているか確認してから再試行してください。`);
    }
  }

  async function handleDesktopSetupSave() {
    const mineruToken = $("setup-mineru-token").value.trim();
    const modelApiKey = $("setup-model-api-key").value.trim();
    if (!mineruToken || !modelApiKey) {
      setDesktopBusy("先に MinerU Token と Model API Key を入力してください。");
      return;
    }
    setDesktopBusy("設定を保存してサービスを起動しています…");
    try {
      await saveDesktopConfig(mineruToken, modelApiKey, checkApiConnectivity);
      onDesktopConfigSaved?.();
      setDesktopBusy("");
    } catch (err) {
      setDesktopBusy(err.message || String(err));
    }
  }

  async function handleOpenOutputDir() {
    try {
      await desktopInvoke("open_output_directory");
    } catch (err) {
      setText("error-box", err.message || String(err));
    }
  }

  return {
    checkApiConnectivity,
    handleDesktopSetupSave,
    handleOpenOutputDir,
    submitForm,
  };
}
