class BrowserCredentialsDialog extends HTMLElement {
  connectedCallback() {
    if (this.dataset.hydrated === "1") {
      return;
    }
    this.dataset.hydrated = "1";
    this.innerHTML = `
      <dialog id="browser-credentials-dialog" class="desktop-dialog">
        <form method="dialog" class="desktop-shell">
          <div class="desktop-head">
            <div class="credential-dialog-head">
              <h2>API 設定</h2>
            </div>
            <button id="browser-credentials-close-btn" type="submit" class="dialog-close-btn" aria-label="閉じる">×</button>
          </div>
          <div class="desktop-body credential-dialog-body">
            <div class="developer-tabs credential-tabs" role="tablist" aria-label="API 設定">
              <button id="browser-credential-tab-api" type="button" class="developer-tab credential-tab is-active" data-credential-tab="api" role="tab" aria-selected="true">API 設定</button>
              <button id="browser-credential-tab-task" type="button" class="developer-tab credential-tab" data-credential-tab="task" role="tab" aria-selected="false">タスクオプション</button>
            </div>
            <div class="credential-card-grid credential-panels">
              <section class="credential-panel is-active" data-credential-panel="api" role="tabpanel">
                <div class="credential-card-grid">
                  <section class="credential-card">
                    <div class="credential-card-head">
                      <div>
                        <h3>MinerU</h3>
                        <p>OCR 解析とレイアウト認識に使用します。</p>
                      </div>
                      <a class="credential-card-link" href="https://mineru.net/apiManage/docs?openApplyModal=true" target="_blank" rel="noopener noreferrer">Token を取得</a>
                    </div>
                    <label>
                      <span class="developer-label">
                        <span>MinerU Token</span>
                        <button type="button" class="developer-hint" aria-label="MinerU Token の説明" data-tooltip="MinerU Token は OCR 解析とレイアウト認識に使います。右上の Token 取得リンクから MinerU コンソールで申請できます。">i</button>
                      </span>
                      <input id="browser-mineru-token" type="text" autocomplete="off" placeholder="MinerU Token を入力" />
                    </label>
                    <div class="credential-card-actions">
                      <button id="browser-mineru-validate-btn" type="button" class="secondary">MinerU を検証</button>
                      <span id="browser-mineru-validation" class="token-inline-status hidden">保存前に MinerU Token を自動検証します。</span>
                    </div>
                  </section>

                  <section class="credential-card">
                    <div class="credential-card-head">
                      <div>
                        <h3>DeepSeek</h3>
                        <p>本文翻訳とモデル呼び出しに使用します。</p>
                      </div>
                      <a class="credential-card-link" href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">Key を取得</a>
                    </div>
                    <label>
                      <span class="developer-label">
                        <span>DeepSeek Key</span>
                        <button type="button" class="developer-hint" aria-label="DeepSeek Key の説明" data-tooltip="DeepSeek Key は本文翻訳とモデル呼び出しに使います。右上の Key 取得リンクから DeepSeek で作成できます。">i</button>
                      </span>
                      <input id="browser-api-key" type="text" autocomplete="off" placeholder="DeepSeek API Key を入力" />
                    </label>
                    <div class="credential-card-actions">
                      <button id="browser-deepseek-validate-btn" type="button" class="secondary">DeepSeek を検証</button>
                      <span id="browser-deepseek-validation" class="token-inline-status hidden">DeepSeek API の接続を検証できます。</span>
                    </div>
                  </section>
                </div>
              </section>

              <section class="credential-card credential-panel" data-credential-panel="task" role="tabpanel" hidden>
                <div class="credential-card-head">
                  <div>
                    <h3>タスクオプション</h3>
                    <p>数式の扱いと見出し翻訳の動作を制御します。</p>
                  </div>
                </div>
                <label>
                  <span class="developer-label">
                    <span>数式モード</span>
                    <button type="button" class="developer-hint" aria-label="数式モードの説明" data-tooltip="プレースホルダ保護は安定性重視の既定です。直出し数式はモデルが直接数式を生成します（実験・調査向け）。">i</button>
                  </span>
                  <select id="browser-job-math-mode" aria-label="数式モード">
                    <option value="placeholder">プレースホルダ保護</option>
                    <option value="direct_typst">直出し数式</option>
                  </select>
                </label>
                <label>
                  <span class="developer-label">
                    <span>見出し翻訳</span>
                    <button type="button" class="developer-hint" aria-label="見出し翻訳の説明" data-tooltip="オンで見出しも翻訳します。オフでは見出しは原文のまま、本文のみ翻訳します。">i</button>
                  </span>
                  <span class="credential-toggle">
                    <input id="browser-translate-titles" type="checkbox" checked />
                    見出しを翻訳
                  </span>
                </label>
              </section>
            </div>
            <div class="actions credential-dialog-actions">
              <button id="browser-credentials-save-btn" type="button">保存</button>
            </div>
          </div>
        </form>
      </dialog>
    `;
  }
}

if (!customElements.get("browser-credentials-dialog")) {
  customElements.define("browser-credentials-dialog", BrowserCredentialsDialog);
}
