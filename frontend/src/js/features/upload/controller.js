import { $ } from "../../dom.js";

export function mountUploadFeature({
  state,
  apiBase,
  apiPrefix,
  frontMaxBytes,
  frontMaxPageCount,
  countPdfPages,
  defaultFileLabel,
  collectUploadFormData,
  submitUploadRequest,
  resetUploadedFile,
  resetUploadProgress,
  setUploadProgress,
  clearFileInputValue,
  setText,
  applyWorkflowMode,
  refreshSubmitControls,
  workflowNeedsUpload,
}) {
  function normalizePageRangeValue(startValue = "", endValue = "") {
    const start = startValue.trim();
    const end = endValue.trim();
    if (!start && !end) {
      return "";
    }
    if (start && end) {
      return start === end ? start : `${start}-${end}`;
    }
    return start || end;
  }

  function currentPageRanges() {
    const applied = state.appliedPageRange || "";
    if (applied) {
      return applied;
    }
    const start = $("page-range-start")?.value || "";
    const end = $("page-range-end")?.value || "";
    return normalizePageRangeValue(start, end);
  }

  function renderPageRangeSummary() {
    const summary = $("page-range-summary");
    if (!summary) {
      return;
    }
    if (!workflowNeedsUpload()) {
      summary.classList.add("hidden");
      summary.textContent = "選択ページ：-";
      return;
    }
    const value = currentPageRanges();
    if (!value) {
      summary.classList.add("hidden");
      summary.textContent = "選択ページ：-";
      return;
    }
    summary.classList.remove("hidden");
    summary.textContent = `選択ページ：${value}`;
  }

  function openPageRangeDialog() {
    const applied = state.appliedPageRange || "";
    const [start = "", end = ""] = applied.includes("-") ? applied.split("-", 2) : [applied, applied];
    const maxPage = frontMaxPageCount || 0;
    const limitText = $("page-range-limit-text");
    const titleEl = $("page-range-title");
    if (maxPage > 0) {
      if (limitText) {
        limitText.textContent = `ページ範囲で今回の翻訳を制限します（最大 ${maxPage} ページ、ページ番号は 1 から）。`;
      }
      if (titleEl) {
        titleEl.textContent = `ページ指定翻訳（最大 ${maxPage} ページ）`;
      }
    } else {
      if (limitText) {
        limitText.textContent = "ページ範囲で今回の翻訳を制限します。ページ番号は 1 からです。";
      }
      if (titleEl) {
        titleEl.textContent = "ページ指定翻訳";
      }
    }
    if (maxPage > 0) {
      if ($("page-range-start")) {
        $("page-range-start").setAttribute("max", String(maxPage));
      }
      if ($("page-range-end")) {
        $("page-range-end").setAttribute("max", String(maxPage));
      }
    }
    if ($("page-range-start")) {
      $("page-range-start").value = start || "";
    }
    if ($("page-range-end")) {
      $("page-range-end").value = end || "";
    }
    $("page-range-dialog")?.showModal();
  }

  function applyPageRanges() {
    const startInput = $("page-range-start");
    const endInput = $("page-range-end");
    const start = startInput?.value?.trim() || "";
    const end = endInput?.value?.trim() || "";
    if ((start && Number(start) < 1) || (end && Number(end) < 1)) {
      setText("error-box", "ページ番号は 1 から始めてください");
      return;
    }
    if ((start && frontMaxPageCount && Number(start) > frontMaxPageCount) || (end && frontMaxPageCount && Number(end) > frontMaxPageCount)) {
      setText("error-box", `ページ番号は ${frontMaxPageCount} を超えられません`);
      return;
    }
    if (start && end && Number(start) > Number(end)) {
      setText("error-box", "開始ページは終了ページより大きくできません");
      return;
    }
    if (frontMaxPageCount && start && end && Number(end) - Number(start) + 1 > frontMaxPageCount) {
      setText("error-box", `ページ範囲は ${frontMaxPageCount} ページを超えられません`);
      return;
    }
    if (startInput) {
      startInput.value = start;
    }
    if (endInput) {
      endInput.value = end;
    }
    state.appliedPageRange = normalizePageRangeValue(start, end);
    setText("error-box", "-");
    renderPageRangeSummary();
    refreshSubmitControls();
    $("page-range-dialog")?.close();
  }

  function clearPageRanges() {
    if ($("page-range-start")) {
      $("page-range-start").value = "";
    }
    if ($("page-range-end")) {
      $("page-range-end").value = "";
    }
    state.appliedPageRange = "";
    renderPageRangeSummary();
    refreshSubmitControls();
  }

  async function handleFileSelected() {
    const file = $("file").files[0];
    resetUploadedFile();
    resetUploadProgress();
    state.appliedPageRange = "";
    renderPageRangeSummary();
    applyWorkflowMode();
    setText("file-label", file ? file.name : defaultFileLabel);
    if ($("file-label")) {
      $("file-label").title = file ? file.name : "";
    }
    if (!file) {
      return;
    }
    if (file.size > frontMaxBytes) {
      setText("error-box", "フロントエンドの上限は 100MB 以内の PDF です");
      setText("upload-status", "ファイルがサイズ上限を超えています");
      $("upload-status")?.classList.remove("hidden");
      return;
    }
    if (frontMaxPageCount && countPdfPages) {
      setText("upload-status", "ページ数を検証しています…");
      $("upload-status")?.classList.remove("hidden");
      try {
        const localPageCount = await countPdfPages(file);
        if (!Number.isFinite(localPageCount) || localPageCount <= 0) {
          setText("error-box", "PDF の解析に失敗しました。ファイルの破損やアクセス権限を確認してください。");
          setText("upload-status", "ファイル検証に失敗しました");
          clearFileInputValue();
          return;
        }
        if (localPageCount > frontMaxPageCount) {
          setText("error-box", `PDF のページ数が上限を超えています：最大 ${frontMaxPageCount} ページ`);
          setText("upload-status", "ページ数が上限を超えています");
          clearFileInputValue();
          return;
        }
      } catch (err) {
        setText("error-box", err?.message || "PDF の解析に失敗しました。しばらくしてから再試行してください。");
        setText("upload-status", "ファイル検証に失敗しました");
        clearFileInputValue();
        return;
      }
    }
    setText("error-box", "-");
    setText("upload-status", "アップロード中…");
    $("upload-status")?.classList.remove("hidden");

    try {
      const payload = await submitUploadRequest(
        `${apiBase()}${apiPrefix}/uploads`,
        collectUploadFormData(file),
        setUploadProgress,
      );
      const uploadedPageCount = Number(payload.page_count || 0);
      if (frontMaxPageCount > 0 && uploadedPageCount > frontMaxPageCount) {
        setText("error-box", `PDF のページ数が上限を超えています：最大 ${frontMaxPageCount} ページ`);
        setText("upload-status", "ページ数が上限を超えています");
        clearFileInputValue();
        resetUploadedFile();
        return;
      }
      state.uploadId = payload.upload_id || "";
      state.uploadedFileName = payload.filename || file.name;
      state.uploadedPageCount = uploadedPageCount;
      state.uploadedBytes = Number(payload.bytes || file.size || 0);
      $("file")?.closest(".upload-tile")?.classList.toggle("is-ready", !!state.uploadId);
      $("file")?.closest(".upload-tile")?.classList.remove("is-uploading");
      setText("upload-status", `アップロード完了: ${state.uploadedFileName} | ${state.uploadedPageCount} ページ | ${(state.uploadedBytes / 1024 / 1024).toFixed(2)} MB`);
      $("upload-status")?.classList.remove("hidden");
      clearFileInputValue();
      refreshSubmitControls();
    } catch (err) {
      resetUploadedFile();
      clearFileInputValue();
      setText("error-box", err.message);
      setText("upload-status", "アップロード失敗");
      $("upload-status")?.classList.remove("hidden");
      applyWorkflowMode();
    }
  }

  return {
    applyPageRanges,
    clearPageRanges,
    currentPageRanges,
    handleFileSelected,
    normalizePageRangeValue,
    openPageRangeDialog,
    renderPageRangeSummary,
  };
}
