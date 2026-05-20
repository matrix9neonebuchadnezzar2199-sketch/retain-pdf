import { apiBase } from "./config.js";

function numberOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function objectOrNull(value) {
  return value && typeof value === "object" ? value : null;
}

export function unwrapEnvelope(payload) {
  if (payload && typeof payload === "object" && "data" in payload && "code" in payload) {
    return payload.data;
  }
  return payload;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function toAbsoluteUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    return `${apiBase()}${trimmed}`;
  }
  return `${apiBase()}/${trimmed}`;
}

export function isTerminalStatus(status) {
  return status === "succeeded" || status === "failed" || status === "canceled";
}

export function normalizeJobPayload(payload) {
  const unwrapped = unwrapEnvelope(payload) || {};
  const timestamps = unwrapped.timestamps || {};
  const progress = unwrapped.progress || {};
  const artifacts = unwrapped.artifacts || {};
  const runtime = unwrapped.runtime || {};
  const failure = unwrapped.failure || null;
  const invocation = unwrapped.invocation || {};
  const status = unwrapped.status || "idle";
  let progressCurrent = numberOrNull(progress.current ?? unwrapped.progress_current);
  let progressTotal = numberOrNull(progress.total ?? unwrapped.progress_total);
  let progressPercent = numberOrNull(progress.percent);

  if (isTerminalStatus(status)) {
    if (progressTotal !== null) {
      progressCurrent = progressTotal;
    }
    if (progressCurrent !== null && progressTotal === null) {
      progressTotal = progressCurrent;
    }
    if (status === "succeeded") {
      progressPercent = 100;
    }
  }

  return {
    raw_response: unwrapped,
    request_payload: unwrapped.request_payload || null,
    request_payload_page_ranges: firstNonEmpty(unwrapped.request_payload?.ocr?.page_ranges),
    request_payload_math_mode: firstNonEmpty(unwrapped.request_payload?.translation?.math_mode),
    job_id: unwrapped.job_id || "",
    workflow: unwrapped.workflow || unwrapped.job_type || "",
    job_type: unwrapped.job_type || unwrapped.workflow || "",
    status,
    stage: unwrapped.stage || "",
    stage_detail: unwrapped.stage_detail || "",
    progress_current: progressCurrent,
    progress_total: progressTotal,
    progress_percent: progressPercent,
    created_at: timestamps.created_at || unwrapped.created_at || "",
    updated_at: timestamps.updated_at || unwrapped.updated_at || "",
    started_at: timestamps.started_at || unwrapped.started_at || "",
    finished_at: timestamps.finished_at || unwrapped.finished_at || "",
    duration_seconds: numberOrNull(timestamps.duration_seconds ?? unwrapped.duration_seconds),
    links: unwrapped.links || {},
    actions: unwrapped.actions || {},
    artifacts,
    runtime,
    invocation,
    failure,
    normalization_summary: objectOrNull(unwrapped.normalization_summary),
    glossary_summary: objectOrNull(unwrapped.glossary_summary),
    current_stage: firstNonEmpty(runtime.current_stage, unwrapped.stage),
    stage_started_at: firstNonEmpty(runtime.stage_started_at),
    last_stage_transition_at: firstNonEmpty(runtime.last_stage_transition_at),
    active_stage_elapsed_ms: numberOrNull(runtime.active_stage_elapsed_ms),
    total_elapsed_ms: numberOrNull(runtime.total_elapsed_ms),
    retry_count: numberOrNull(runtime.retry_count) ?? 0,
    last_retry_at: firstNonEmpty(runtime.last_retry_at),
    stage_history: arrayOrEmpty(runtime.stage_history),
    terminal_reason: firstNonEmpty(runtime.terminal_reason),
    final_failure_category: firstNonEmpty(runtime.final_failure_category),
    final_failure_summary: firstNonEmpty(runtime.final_failure_summary),
    failure_diagnostic: unwrapped.failure_diagnostic || null,
    log_tail: Array.isArray(unwrapped.log_tail) ? unwrapped.log_tail : [],
    error: unwrapped.error || "",
    pdf_ready: Boolean(artifacts.pdf_ready ?? artifacts.pdf?.ready),
    markdown_ready: Boolean(artifacts.markdown_ready ?? artifacts.markdown?.ready),
    bundle_ready: Boolean(artifacts.bundle_ready ?? artifacts.bundle?.ready),
  };
}

export function summarizeInvocationProtocol(payload) {
  const invocation = payload?.invocation || {};
  const inputProtocol = firstNonEmpty(invocation.input_protocol);
  if (inputProtocol === "stage_spec") {
    return "Stage Spec";
  }
  return "-";
}

export function summarizeInvocationSchemaVersion(payload) {
  const invocation = payload?.invocation || {};
  return firstNonEmpty(invocation.stage_spec_schema_version) || "-";
}

export function resolveJobActions(job) {
  const artifacts = job.artifacts || {};
  const links = job.links || {};
  const actions = job.actions || {};
  const artifactActions = artifacts.actions || {};
  const bundleEnabled = Boolean(
    actions.download_bundle?.enabled
    || artifactActions.download_bundle?.enabled
    || artifacts.bundle?.ready
    || artifacts.bundle_ready
    || job.bundle_ready
  );
  const pdfEnabled = Boolean(
    actions.download_pdf?.enabled
    || artifactActions.download_pdf?.enabled
    || artifacts.pdf?.ready
    || artifacts.pdf_ready
    || job.pdf_ready
  );
  const markdownJsonEnabled = Boolean(
    actions.open_markdown?.enabled
    || artifactActions.open_markdown?.enabled
    || artifacts.markdown?.ready
    || artifacts.markdown_ready
    || job.markdown_ready
  );
  const markdownRawEnabled = Boolean(
    actions.open_markdown_raw?.enabled
    || artifactActions.open_markdown_raw?.enabled
    || artifacts.markdown?.ready
    || artifacts.markdown_ready
    || job.markdown_ready
  );
  return {
    cancelEnabled: Boolean(actions.cancel?.enabled ?? artifactActions.cancel?.enabled ?? (job.status === "queued" || job.status === "running")),
    bundleEnabled,
    pdfEnabled,
    markdownJsonEnabled,
    markdownRawEnabled,
    cancel: toAbsoluteUrl(firstNonEmpty(
      actions.cancel?.url,
      artifactActions.cancel?.url,
      actions.cancel_url,
      links.cancel_url,
      links.cancel_path,
    )),
    bundle: toAbsoluteUrl(firstNonEmpty(
      actions.download_bundle?.url,
      artifactActions.download_bundle?.url,
      actions.download_bundle_url,
      actions.bundle_url,
      artifacts.bundle?.url,
      artifacts.bundle?.path,
      artifacts.bundle_url,
    )),
    pdf: toAbsoluteUrl(firstNonEmpty(
      actions.download_pdf?.url,
      artifactActions.download_pdf?.url,
      actions.download_pdf_url,
      actions.pdf_url,
      artifacts.pdf?.url,
      artifacts.pdf?.path,
      artifacts.pdf_url,
    )),
    markdownJson: toAbsoluteUrl(firstNonEmpty(
      actions.open_markdown?.url,
      artifactActions.open_markdown?.url,
      actions.open_markdown_json_url,
      actions.markdown_json_url,
      artifacts.markdown?.json_url,
      artifacts.markdown?.json_path,
      artifacts.markdown_url,
    )),
    markdownRaw: toAbsoluteUrl(firstNonEmpty(
      actions.open_markdown_raw?.url,
      artifactActions.open_markdown_raw?.url,
      actions.download_markdown_url,
      actions.markdown_raw_url,
      artifacts.markdown?.raw_url,
      artifacts.markdown?.raw_path,
    )),
  };
}

export function summarizeStatus(status) {
  switch (status) {
    case "queued":
      return "タスクを送信しました。バックエンドの処理開始を待っています。";
    case "running":
      return "タスクを処理中です。現在の段階が完了するまでお待ちください。";
    case "succeeded":
      return "タスクが完了しました。結果をダウンロードできます。";
    case "canceled":
      return "タスクはキャンセルされました。";
    case "failed":
      return "タスクは失敗しました。エラー内容を確認してから再試行してください。";
    default:
      return "タスクの送信を待っています。";
  }
}

export function summarizeStageDetail(payload) {
  const detail = firstNonEmpty(
    payload.failure?.summary,
    payload.stage_detail,
    payload.runtime?.current_stage,
    payload.current_stage,
  );
  if (detail) {
    return detail;
  }
  switch (payload.status) {
    case "queued":
      return "待機中";
    case "running":
      return "バックエンドがドキュメントを処理中";
    case "succeeded":
      return "処理完了";
    case "failed":
      return "処理失敗";
    default:
      return "-";
  }
}

export function summarizePublicError(payload) {
  if (payload.status === "canceled") {
    return "タスクはキャンセルされました。";
  }
  if (payload.status === "failed") {
    const detail = firstNonEmpty(
      payload.failure?.summary,
      payload.final_failure_summary,
      payload.failure_diagnostic?.summary,
      payload.stage_detail,
      payload.error,
      payload.raw_response?.message,
    );
    return detail || "タスクに失敗しました。入力ファイルと設定を確認してから再試行してください。";
  }
  if (payload.error) {
    return payload.error;
  }
  return "-";
}

export function summarizeDiagnostic(payload) {
  const failure = payload.failure;
  if (failure) {
    const lines = [
      `段階: ${failure.stage || "-"}`,
      `分類: ${failure.category || "-"}`,
      `概要: ${failure.summary || "-"}`,
      `リトライ可: ${failure.retryable ? "はい" : "いいえ"}`,
    ];
    if (failure.upstream_host) {
      lines.push(`上流ホスト: ${failure.upstream_host}`);
    }
    if (failure.root_cause) {
      lines.push(`根本原因: ${failure.root_cause}`);
    }
    if (failure.suggestion) {
      lines.push(`提案: ${failure.suggestion}`);
    }
    if (failure.last_log_line) {
      lines.push(`直近ログ: ${failure.last_log_line}`);
    }
    return lines.join("\n");
  }
  const diag = payload.failure_diagnostic;
  if (!diag) {
    return "-";
  }
  const lines = [
    `段階: ${diag.stage || diag.failed_stage || "-"}`,
    `種別: ${diag.type || diag.error_kind || "-"}`,
    `概要: ${diag.summary || "-"}`,
    `リトライ可: ${diag.retryable ? "はい" : "いいえ"}`,
  ];
  if (diag.upstream_host) {
    lines.push(`上流ホスト: ${diag.upstream_host}`);
  }
  if (diag.root_cause) {
    lines.push(`根本原因: ${diag.root_cause}`);
  }
  if (diag.suggestion) {
    lines.push(`提案: ${diag.suggestion}`);
  }
  if (diag.last_log_line) {
    lines.push(`直近ログ: ${diag.last_log_line}`);
  }
  return lines.join("\n");
}

function formatDurationMs(ms) {
  const num = Number(ms);
  if (!Number.isFinite(num) || num < 0) {
    return "-";
  }
  const totalSeconds = Math.floor(num / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}時間 ${minutes}分 ${seconds}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分 ${seconds}秒`;
  }
  return `${seconds}秒`;
}

export function summarizeRuntimeField(value) {
  const text = firstNonEmpty(value);
  return text || "-";
}

export function formatRuntimeDuration(ms) {
  return formatDurationMs(ms);
}

export function formatEventTimestamp(value) {
  const rawValue = `${value || ""}`.trim();
  if (!rawValue) {
    return "-";
  }
  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function formatJobFinishedAt(payload) {
  if (!payload || !isTerminalStatus(payload.status)) {
    return "-";
  }
  const rawValue = (payload.finished_at || payload.updated_at || "").trim();
  if (!rawValue) {
    return "-";
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function formatJobDuration(payload) {
  if (!payload || !isTerminalStatus(payload.status)) {
    return "-";
  }
  const startedRaw = (payload.started_at || "").trim();
  const finishedRaw = (payload.finished_at || payload.updated_at || "").trim();
  if (!startedRaw || !finishedRaw) {
    return "-";
  }

  const startedAt = new Date(startedRaw);
  const finishedAt = new Date(finishedRaw);
  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(finishedAt.getTime())) {
    return "-";
  }

  const totalSeconds = Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}時間 ${minutes}分 ${seconds}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分 ${seconds}秒`;
  }
  return `${seconds}秒`;
}
