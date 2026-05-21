# タスクリスト API

## 1. 主 API

- `GET /api/v1/jobs` — メインタスク一覧
- `GET /api/v1/ocr/jobs` — OCR サブタスク一覧

用途: 最近のタスク、履歴一覧、簡易フィルタパネル。

## 2. クエリパラメータ

- `limit` — 省略時はバックエンド既定
- `offset` — 既定 `0`
- `status` — `queued` / `running` / `succeeded` / `failed` / `canceled`
- `workflow` — `mineru` / `ocr`
- `provider` — 例: `mineru`（OCR provider 診断フィルタ）

## 3. ソート

`updated_at DESC` 固定。最近更新されたタスクが先。作成日時順ではない。

## 4. 返却構造

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [
      {
        "job_id": "20260406063244-2176e4",
        "display_name": "paper.pdf",
        "workflow": "mineru",
        "status": "running",
        "trace_id": "trace-abc",
        "stage": "translating",
        "invocation": {
          "stage": "mineru",
          "input_protocol": "stage_spec",
          "stage_spec_schema_version": "mineru.stage.v1"
        },
        "created_at": "2026-04-06T06:32:44Z",
        "updated_at": "2026-04-06T06:33:00Z",
        "detail_path": "/api/v1/jobs/20260406063244-2176e4",
        "detail_url": "http://127.0.0.1:41000/api/v1/jobs/20260406063244-2176e4"
      }
    ],
    "invocation_summary": {
      "stage_spec_count": 1,
      "unknown_count": 0
    }
  }
}
```

各 item: `job_id`, `display_name`, `workflow`, `status`, `trace_id`, `stage`, `created_at`, `updated_at`, `detail_path`, `detail_url`, `invocation`。

集約: `data.invocation_summary`。

## 5. フィールドの意味

- `display_name`: 表示名。優先順 — アップロード PDF 名 → リモート URL 末尾 → `job_id`
- `trace_id`: artifacts に紐づく trace。空のことあり
- `stage`: 一覧用の粗い段階。`stage_detail` の代替不可
- `invocation`: 一覧用プロトコル要約。`input_protocol=stage_spec` が新版の目安

## 6. フロント推奨

- 最近: `GET /api/v1/jobs?limit=20&offset=0`
- 失敗のみ: `?status=failed`
- OCR のみ: `GET /api/v1/ocr/jobs`

表示: `display_name`, `status`, `stage`, `invocation.input_protocol`, `updated_at` → クリックで `detail_url`

## 7. リストに含まれないもの

`stage_detail`, `runtime`, `runtime.stage_history`, `failure.summary`, `artifacts` は詳細 API で取得。一覧に全情報を載せない設計。

## 8. OCR リスト

`GET /api/v1/ocr/jobs` は同一ロジックに `workflow=ocr` 固定。構造は同じ、範囲のみ異なる。

## 9. 設計意図

一覧は軽量、詳細は完全状態。ホームを速くし、詳細でフル取得する方が長期保守に有利。
