class DeveloperSettingsDialog extends HTMLElement {
  connectedCallback() {
    if (this.dataset.hydrated === "1") {
      return;
    }
    this.dataset.hydrated = "1";
    this.innerHTML = `
      <dialog id="developer-dialog" class="desktop-dialog">
        <form method="dialog" class="desktop-shell">
          <div class="desktop-head">
            <div class="credential-dialog-head">
              <h2>開発者設定</h2>
            </div>
            <button id="developer-close-btn" type="submit" class="dialog-close-btn" aria-label="閉じる">×</button>
          </div>
          <div class="desktop-body credential-dialog-body developer-dialog-body">
            <div class="developer-tabs" role="tablist" aria-label="開発者設定">
              <button id="developer-tab-model" type="button" class="developer-tab is-active" data-developer-tab="model" role="tab" aria-selected="true">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7.5h16M4 12h10M4 16.5h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
                </svg>
                <span>モデル</span>
              </button>
              <button id="developer-tab-runtime" type="button" class="developer-tab" data-developer-tab="runtime" role="tab" aria-selected="false">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3.5v3m0 11v3m8.5-8.5h-3m-11 0h-3M18.01 5.99l-2.12 2.12M8.11 15.89l-2.12 2.12m0-12.02 2.12 2.12m7.78 7.78 2.12 2.12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="1.6"/>
                </svg>
                <span>実行</span>
              </button>
            </div>

            <div class="developer-panels">
              <section id="developer-panel-model" class="developer-panel is-active" data-developer-panel="model" role="tabpanel">
                <div class="credential-card compact-card">
                  <label>
                    <span>タスクワークフロー</span>
                    <select id="developer-workflow">
                      <option value="mineru">mineru · OCR + 翻訳 + レンダリング</option>
                      <option value="translate">translate · OCR + 翻訳</option>
                      <option value="render">render · 既存タスク成果物を再利用して再レンダリング</option>
                    </select>
                  </label>
                  <label id="developer-render-source-wrap" class="hidden">
                    <span>レンダー元タスク ID</span>
                    <input id="developer-render-source-job-id" type="text" autocomplete="off" placeholder="既存の job_id を入力" />
                  </label>
                  <p id="developer-workflow-note" class="muted">\`mineru\` は OCR、翻訳、PDF レンダリングをすべて実行します。</p>
                  <label>
                    <span>モデル Base URL</span>
                    <input id="developer-base-url" type="text" autocomplete="off" placeholder="例: https://api.deepseek.com/v1" />
                  </label>
                  <label>
                    <span>モデル名</span>
                    <input id="developer-model" type="text" autocomplete="off" placeholder="例: deepseek-chat" />
                  </label>
                </div>
              </section>

              <section id="developer-panel-runtime" class="developer-panel" data-developer-panel="runtime" role="tabpanel" hidden>
                <div class="credential-card compact-card">
                  <div class="grid two developer-grid">
                    <label>
                      <span class="developer-label">
                        <span>翻訳並列数</span>
                        <button type="button" class="developer-hint" aria-label="翻訳並列数の説明" data-tooltip="翻訳モデルへ同時送信するタスク数です。大きいほど速くなりやすい一方、レート制限に当たりやすくなります。">i</button>
                      </span>
                      <input id="developer-workers" type="number" min="1" step="1" inputmode="numeric" />
                    </label>
                    <label>
                      <span class="developer-label">
                        <span>レンダリング並列数</span>
                        <button type="button" class="developer-hint" aria-label="レンダリング並列数の説明" data-tooltip="最終 PDF のレンダリング・コンパイル時の並列数です。">i</button>
                      </span>
                      <input id="developer-compile-workers" type="number" min="1" step="1" inputmode="numeric" />
                    </label>
                    <label>
                      <span class="developer-label">
                        <span>翻訳バッチサイズ</span>
                        <button type="button" class="developer-hint" aria-label="翻訳バッチサイズの説明" data-tooltip="翻訳モデルへ一度に送るテキストの量です。大きすぎると不安定になることがあります。">i</button>
                      </span>
                      <input id="developer-batch-size" type="number" min="1" step="1" inputmode="numeric" />
                    </label>
                    <label>
                      <span class="developer-label">
                        <span>分類バッチサイズ</span>
                        <button type="button" class="developer-hint" aria-label="分類バッチサイズの説明" data-tooltip="論文分野の識別・戦略分類で使うバッチサイズです。">i</button>
                      </span>
                      <input id="developer-classify-batch-size" type="number" min="1" step="1" inputmode="numeric" />
                    </label>
                    <label class="developer-span-full">
                      <span class="developer-label">
                        <span>タイムアウト（秒）</span>
                        <button type="button" class="developer-hint" aria-label="タイムアウトの説明" data-tooltip="1 タスクの総タイムアウト秒数です。超過するとバックエンドがタスクを終了します。">i</button>
                      </span>
                      <input id="developer-timeout-seconds" type="number" min="1" step="1" inputmode="numeric" />
                    </label>
                  </div>
                </div>
              </section>
            </div>
            <div class="actions credential-dialog-actions">
              <button id="developer-reset-btn" type="button" class="secondary">既定値に戻す</button>
              <button id="developer-save-btn" type="button">保存</button>
            </div>
          </div>
        </form>
      </dialog>
    `;
  }
}

if (!customElements.get("developer-settings-dialog")) {
  customElements.define("developer-settings-dialog", DeveloperSettingsDialog);
}
