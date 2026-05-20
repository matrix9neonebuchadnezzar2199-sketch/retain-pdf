import { apiBase, buildApiHeaders, frontendApiKey, isMockMode } from "./config.js";
import { unwrapEnvelope } from "./job.js";
import {
  fetchMockProtected,
  getMockJobArtifactsManifest,
  getMockJobEvents,
  getMockJobList,
  getMockJobPayload,
  submitMockJob,
  submitMockUpload,
} from "./mock.js";

export async function fetchJobPayload(jobId, apiPrefix) {
  if (isMockMode()) {
    void apiPrefix;
    return getMockJobPayload(jobId);
  }
  const resp = await fetch(`${apiBase()}${apiPrefix}/jobs/${jobId}`, {
    headers: buildApiHeaders(),
  });
  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error("タスクが見つかりません。job_id が正しいか確認してください。");
    }
    throw new Error(`タスクの読み込みに失敗しました。しばらくしてから再試行してください。(${resp.status})`);
  }
  const payloadJson = await resp.json();
  return unwrapEnvelope(payloadJson);
}

export async function fetchJobEvents(jobId, apiPrefix, limit = 50, offset = 0) {
  if (isMockMode()) {
    void jobId;
    void apiPrefix;
    const payload = getMockJobEvents();
    return { ...payload, limit, offset };
  }
  const resp = await fetch(`${apiBase()}${apiPrefix}/jobs/${jobId}/events?limit=${limit}&offset=${offset}`, {
    headers: buildApiHeaders(),
  });
  if (!resp.ok) {
    if (resp.status === 404) {
      return { items: [], limit, offset };
    }
    throw new Error(`イベントストリームの読み込みに失敗しました。しばらくしてから再試行してください。(${resp.status})`);
  }
  const payloadJson = await resp.json();
  return unwrapEnvelope(payloadJson);
}

export async function fetchJobArtifactsManifest(jobId, apiPrefix) {
  if (isMockMode()) {
    void jobId;
    void apiPrefix;
    return getMockJobArtifactsManifest();
  }
  const resp = await fetch(`${apiBase()}${apiPrefix}/jobs/${jobId}/artifacts-manifest`, {
    headers: buildApiHeaders(),
  });
  if (!resp.ok) {
    if (resp.status === 404) {
      return { items: [] };
    }
    throw new Error(`成果物一覧の読み込みに失敗しました。しばらくしてから再試行してください。(${resp.status})`);
  }
  const payloadJson = await resp.json();
  return unwrapEnvelope(payloadJson);
}

export async function fetchJobList(
  apiPrefix,
  {
    limit = 20,
    offset = 0,
    status = "",
    workflow = "",
    provider = "",
    scope = "jobs",
  } = {},
) {
  if (isMockMode()) {
    void apiPrefix;
    return getMockJobList();
  }
  const params = new URLSearchParams();
  params.set("limit", `${limit}`);
  params.set("offset", `${offset}`);
  if (status) {
    params.set("status", status);
  }
  if (workflow) {
    params.set("workflow", workflow);
  }
  if (provider) {
    params.set("provider", provider);
  }
  const normalizedScope = scope === "ocr" ? "ocr/jobs" : "jobs";
  const resp = await fetch(`${apiBase()}${apiPrefix}/${normalizedScope}?${params.toString()}`, {
    headers: buildApiHeaders(),
  });
  if (!resp.ok) {
    throw new Error(`最近のタスクの読み込みに失敗しました。しばらくしてから再試行してください。(${resp.status})`);
  }
  const payloadJson = await resp.json();
  return unwrapEnvelope(payloadJson);
}

export function submitUploadRequest(url, form, onProgress) {
  if (isMockMode()) {
    void url;
    void form;
    onProgress?.(1, 1);
    return Promise.resolve(submitMockUpload());
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";
    const apiKey = frontendApiKey();
    if (apiKey) {
      xhr.setRequestHeader("X-API-KEY", apiKey);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (!onProgress) {
        return;
      }
      if (event.lengthComputable) {
        onProgress(event.loaded, event.total);
      } else {
        onProgress(NaN, NaN);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(unwrapEnvelope(xhr.response));
        return;
      }
      const message = typeof xhr.response === "object" && xhr.response
        ? (xhr.response.message || JSON.stringify(xhr.response))
        : (xhr.responseText || "");
      reject(new Error(`送信に失敗しました: ${xhr.status} ${message}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error(`送信に失敗しました: ネットワークエラー。現在の API Base は ${apiBase()}、アップロード先は ${url} です。ローカルサービスが起動しているか確認してください。`));
    });

    xhr.send(form);
  });
}

export async function submitJson(url, payload) {
  if (isMockMode()) {
    void payload;
    if (/\/jobs(?:$|\?)/.test(url)) {
      return submitMockJob();
    }
    if (/\/cancel(?:$|\?)/.test(url)) {
      return { ok: true };
    }
  }
  const resp = await fetch(url, {
    method: "POST",
    headers: buildApiHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errorPayload = await resp.json();
      throw new Error(`送信に失敗しました: ${resp.status} ${errorPayload.message || JSON.stringify(errorPayload)}`);
    }
    const text = await resp.text();
    throw new Error(`送信に失敗しました: ${resp.status} ${text}`);
  }
  const payloadJson = await resp.json();
  return unwrapEnvelope(payloadJson);
}

export async function validateMineruToken(apiPrefix, payload) {
  if (isMockMode()) {
    void apiPrefix;
    void payload;
    return {
      ok: true,
      valid: true,
      summary: "mock mode: token validation skipped",
    };
  }
  return submitJson(`${apiBase()}${apiPrefix}/providers/mineru/validate-token`, payload);
}

export async function fetchProtected(url, options = {}) {
  if (isMockMode() && `${url || ""}`.startsWith("mock://")) {
    return fetchMockProtected(url);
  }
  const headers = buildApiHeaders(options.headers || {});
  return fetch(url, {
    ...options,
    headers,
  });
}
