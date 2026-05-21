# エンドポイント説明

## 1. PDF アップロード

`POST /api/v1/uploads`

フォームフィールド:

- `file`: 必須、PDF ファイル

例:

```bash
curl -X POST http://127.0.0.1:41000/api/v1/uploads \
  -H "X-API-Key: your-rust-api-key" \
  -F "file=@/path/to/paper.pdf"
```

## 2. メインタスクの作成

`POST /api/v1/jobs`

よく使うリクエストボディ:

```json
{
  "workflow": "mineru",
  "upload_id": "20260402073151-a80618",
  "mode": "sci",
  "model": "deepseek-chat",
  "base_url": "https://api.deepseek.com/v1",
  "api_key": "sk-xxxx",
  "mineru_token": "mineru-xxxx",
  "model_version": "vlm",
  "language": "ch",
  "render_mode": "auto",
  "skip_title_translation": false,
  "batch_size": 1,
  "workers": 100,
  "classify_batch_size": 12,
  "compile_workers": 8,
  "rule_profile_name": "general_sci",
  "custom_rules_text": ""
}
```

補足:

- `skip_title_translation=false`: タイトルも翻訳
- `skip_title_translation=true`: タイトル翻訳をスキップし原文タイトルを保持

## 3. タスク詳細の取得

`GET /api/v1/jobs/{job_id}`

返却で重点的に見るフィールド:

- `status`
- `stage`
- `stage_detail`
- `progress`
- `artifacts`
- `ocr_job`
- `failure_diagnostic`
- `log_tail`

## 4. イベントストリームの取得

`GET /api/v1/jobs/{job_id}/events`

フロントエンドの進捗表示とトラブルシュートに使用します。

## 5. 成果物のダウンロード

- `GET /api/v1/jobs/{job_id}/pdf`
- `GET /api/v1/jobs/{job_id}/markdown`
- `GET /api/v1/jobs/{job_id}/markdown?raw=true`
- `GET /api/v1/jobs/{job_id}/download`
- `GET /api/v1/jobs/{job_id}/normalized-document`
- `GET /api/v1/jobs/{job_id}/normalization-report`

## 6. タスクのキャンセル

`POST /api/v1/jobs/{job_id}/cancel`

## 7. よくある状態

`status`:

- `queued`
- `running`
- `succeeded`
- `failed`
- `canceled`

よくある `stage`:

- `queued`
- `ocr_submitting`
- `ocr_upload`
- `mineru_upload`
- `mineru_processing`
- `translation_prepare`
- `normalizing`
- `domain_inference`
- `continuation_review`
- `page_policies`
- `translating`
- `rendering`
- `saving`
- `finished`
- `failed`
