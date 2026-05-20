class DesktopSetupDialog extends HTMLElement {
  connectedCallback() {
    if (this.dataset.hydrated === "1") {
      return;
    }
    this.dataset.hydrated = "1";
    this.innerHTML = `
      <dialog id="desktop-setup-dialog" class="desktop-dialog">
        <form method="dialog" class="desktop-shell">
          <div class="desktop-head">
            <h2>初回設定</h2>
            <button id="desktop-setup-close-btn" type="submit" class="dialog-close-btn" aria-label="閉じる">×</button>
          </div>
          <div class="desktop-body">
            <p class="muted">初回利用前に、MinerU Token と大規模言語モデルの API Key を入力してください。</p>
            <div class="grid two">
              <label>
                <span>MinerU Token</span>
                <input id="setup-mineru-token" type="text" autocomplete="off" />
              </label>
              <label>
                <span>DeepSeek Key</span>
                <input id="setup-model-api-key" type="text" autocomplete="off" />
              </label>
            </div>
            <div id="desktop-setup-error" class="upload-status hidden"></div>
            <div class="actions">
              <button id="desktop-setup-save-btn" type="button">保存して起動</button>
            </div>
          </div>
        </form>
      </dialog>
    `;
  }
}

if (!customElements.get("desktop-setup-dialog")) {
  customElements.define("desktop-setup-dialog", DesktopSetupDialog);
}
