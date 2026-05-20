class PageRangeDialog extends HTMLElement {
  connectedCallback() {
    if (this.dataset.hydrated === "1") {
      return;
    }
    this.dataset.hydrated = "1";
    this.innerHTML = `
      <dialog id="page-range-dialog" class="desktop-dialog page-range-dialog">
        <form method="dialog" class="desktop-shell">
          <div class="desktop-head">
            <h2 id="page-range-title">ページ指定翻訳</h2>
            <button id="page-range-close-btn" type="submit" class="dialog-close-btn" aria-label="閉じる">×</button>
          </div>
          <div class="desktop-body">
            <p id="page-range-limit-text" class="muted">ページ範囲で今回の翻訳を制限します。ページ番号は 1 からです。</p>
            <div class="grid two">
              <label>
                <span>開始ページ</span>
                <input id="page-range-start" type="number" min="1" step="1" inputmode="numeric" autocomplete="off" placeholder="例: 1" />
              </label>
              <label>
                <span>終了ページ</span>
                <input id="page-range-end" type="number" min="1" step="1" inputmode="numeric" autocomplete="off" placeholder="例: 15" />
              </label>
            </div>
            <div class="actions">
              <button id="page-range-clear-btn" type="button" class="secondary">クリア</button>
              <button id="page-range-apply-btn" type="button">適用</button>
            </div>
          </div>
        </form>
      </dialog>
    `;
  }
}

if (!customElements.get("page-range-dialog")) {
  customElements.define("page-range-dialog", PageRangeDialog);
}
