# エラー排查

## 1. 優先して確認するフィールド

タスク失敗の排查では、次を優先します。

1. `stage`
2. `stage_detail`
3. `error`
4. `failure_diagnostic`
5. `log_tail`
6. `/api/v1/jobs/{job_id}/events`

## 2. 現在のエラー保持能力

バックエンドは OCR provider 失敗時のエラー保持を強化済みです。

- `jobs.error` に完全な error chain を保存
- `log_tail` に `ERROR:` と `CAUSE[n]:` を書き込み
- 識別可能な場合は provider の `trace_id` を保持

以前は次のような一行だけでした。

```text
MinerU apply upload url failed
```

現在は可能な限り次のように保持します。

```text
MinerU apply upload url failed
Caused by:
- POST https://mineru.net/api/v4/file-urls/batch failed
- ...
```

## 3. よくある排查手順

### 3.1 まず API を確認

```bash
curl http://127.0.0.1:41000/health
curl -H "X-API-Key: your-key" http://127.0.0.1:41000/api/v1/jobs/{job_id}
curl -H "X-API-Key: your-key" http://127.0.0.1:41000/api/v1/jobs/{job_id}/events
```

### 3.2 次にタスクディレクトリを確認

重点ディレクトリ:

- `data/jobs/{job_id}/logs/`
- `data/jobs/{job_id}/ocr/`
- `data/jobs/{job_id}/translated/`
- `data/jobs/{job_id}/rendered/`

### 3.3 MinerU 系エラー

OCR transport で失敗した場合:

- `provider_trace_id` を確認
- `failure_diagnostic` を確認
- `log_tail` 内の `CAUSE[n]` を確認
- 必要に応じて MinerU 上流 API の応答と照合
