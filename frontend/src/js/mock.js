const MOCK_JOB_ID = "mock-job-20260415";

function currentMockScenario() {
  const value = new URLSearchParams(window.location.search).get("mock")?.trim().toLowerCase() || "";
  return ["queued", "running", "succeeded", "failed"].includes(value) ? value : "";
}

function isoOffsetMinutes(minutes) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function buildMockJobPayload(scenario = currentMockScenario()) {
  const normalized = scenario || "running";
  const progressMap = {
    queued: { current: 0, total: 100, percent: 0, stage: "待機中" },
    running: { current: 62, total: 100, percent: 62, stage: "本文と数式を翻訳中" },
    succeeded: { current: 100, total: 100, percent: 100, stage: "処理完了" },
    failed: { current: 78, total: 100, percent: 78, stage: "レンダリング段階で失敗" },
  };
  const progress = progressMap[normalized];
  const status = normalized;
  return {
    job_id: MOCK_JOB_ID,
    workflow: "mineru",
    job_type: "mineru",
    status,
    stage: normalized === "queued" ? "queued" : normalized === "failed" ? "render" : "translate",
    stage_detail: progress.stage,
    progress: {
      current: progress.current,
      total: progress.total,
      percent: progress.percent,
    },
    timestamps: {
      created_at: isoOffsetMinutes(-12),
      updated_at: isoOffsetMinutes(0),
      started_at: isoOffsetMinutes(-10),
      finished_at: status === "succeeded" || status === "failed" ? isoOffsetMinutes(-1) : "",
      duration_seconds: status === "succeeded" ? 540 : status === "failed" ? 496 : null,
    },
    runtime: {
      current_stage: progress.stage,
      active_stage_elapsed_ms: status === "queued" ? 42_000 : 214_000,
      total_elapsed_ms: status === "queued" ? 42_000 : 536_000,
      retry_count: status === "failed" ? 1 : 0,
      terminal_reason: status === "failed" ? "レンダラーの終了コードが非ゼロ" : status === "succeeded" ? "completed" : "",
    },
    invocation: {
      input_protocol: "stage_spec",
      stage_spec_schema_version: "v1",
    },
    request_payload: {
      source: { upload_id: "mock-upload-id" },
      ocr: {
        provider: "mineru",
        page_ranges: "1-12",
      },
      translation: {
        mode: "sci",
        math_mode: "direct_typst",
      },
      render: {
        render_mode: "auto",
      },
    },
    actions: {
      cancel: {
        enabled: status === "queued" || status === "running",
        url: "mock://cancel",
      },
      download_pdf: {
        enabled: status === "succeeded",
        url: "mock://translated.pdf",
      },
      download_bundle: {
        enabled: status === "succeeded",
        url: "mock://bundle.zip",
      },
    },
    artifacts: {
      pdf_ready: status === "succeeded",
      markdown_ready: status === "succeeded",
      bundle_ready: status === "succeeded",
    },
    failure: status === "failed"
      ? {
          summary: "タスクは失敗しました（フロントエンド mock シナリオ）。",
          category: "mock_render_failure",
          stage: "render",
          root_cause: "UI デバッグ用の模擬失敗です。",
          suggestion: "?mock=succeeded に切り替えて成功状態を確認してください。",
          retryable: true,
        }
      : null,
  };
}

function buildMockManifest(scenario = currentMockScenario()) {
  if (scenario !== "succeeded") {
    return { items: [] };
  }
  return {
    items: [
      { artifact_key: "source_pdf", ready: true, resource_url: "mock://source.pdf" },
      { artifact_key: "pdf", ready: true, resource_url: "mock://translated.pdf" },
      { artifact_key: "markdown_bundle_zip", ready: true, resource_url: "mock://bundle.zip" },
    ],
  };
}

function buildMockEvents(scenario = currentMockScenario()) {
  const items = [
    {
      timestamp: isoOffsetMinutes(-10),
      level: "info",
      stage: "queued",
      title: "タスクがキューに入りました",
      payload: { scenario },
    },
  ];
  if (scenario !== "queued") {
    items.push({
      timestamp: isoOffsetMinutes(-8),
      level: "info",
      stage: "translate",
      title: "翻訳段階が開始しました",
      payload: { progress_percent: scenario === "running" ? 62 : 100 },
    });
  }
  if (scenario === "succeeded") {
    items.push({
      timestamp: isoOffsetMinutes(-1),
      level: "info",
      stage: "render",
      title: "PDF が生成されました",
      payload: { artifact_key: "pdf" },
    });
  }
  if (scenario === "failed") {
    items.push({
      timestamp: isoOffsetMinutes(-1),
      level: "error",
      stage: "render",
      title: "レンダリング失敗",
      payload: { message: "mock render failure" },
    });
  }
  return { items, limit: 50, offset: 0 };
}

function mockPdfBytes(label = "Mock PDF") {
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 68 >>
stream
BT
/F1 24 Tf
72 760 Td
(${label}) Tj
0 -36 Td
(RetainPDF Mock Preview) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000366 00000 n 
trailer
<< /Root 1 0 R /Size 6 >>
startxref
436
%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function isMockScenarioEnabled() {
  return !!currentMockScenario();
}

export function getMockScenario() {
  return currentMockScenario();
}

export function getMockJobId() {
  return MOCK_JOB_ID;
}

export function getMockJobPayload(jobId = "") {
  if (jobId && jobId !== MOCK_JOB_ID) {
    throw new Error("mock タスクが見つかりません。job_id が正しいか確認してください。");
  }
  return buildMockJobPayload();
}

export function getMockJobEvents() {
  return buildMockEvents();
}

export function getMockJobArtifactsManifest() {
  return buildMockManifest();
}

export function getMockJobList() {
  return {
    items: [buildMockJobPayload()],
    limit: 20,
    offset: 0,
    has_more: false,
  };
}

export function submitMockJob() {
  return buildMockJobPayload();
}

export function submitMockUpload() {
  return {
    upload_id: "mock-upload-id",
    filename: "mock.pdf",
    page_count: 12,
    bytes: 2_621_440,
  };
}

export async function fetchMockProtected(url) {
  const normalized = `${url || ""}`.trim();
  if (normalized === "mock://translated.pdf") {
    return new Response(mockPdfBytes("Translated PDF"), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  }
  if (normalized === "mock://source.pdf") {
    return new Response(mockPdfBytes("Source PDF"), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  }
  if (normalized === "mock://bundle.zip") {
    return new Response(new Uint8Array([80, 75, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
      },
    });
  }
  return new Response("mock resource not found", { status: 404 });
}
