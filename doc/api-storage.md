# ストレージ構造

現在は `DATA_ROOT` をランタイムルートとして統一利用します。

## 1. 主要パス

- `DATA_ROOT/uploads/`: アップロードファイル
- `DATA_ROOT/jobs/{job_id}/`: 単一タスクの作業ディレクトリ
- `DATA_ROOT/downloads/`: ダウンロードキャッシュ
- `DATA_ROOT/db/jobs.db`: SQLite

## 2. タスクディレクトリ構造

```text
jobs/{job_id}/
├── source/
├── ocr/
├── translated/
├── rendered/
├── artifacts/
└── logs/
```

## 3. イベントファイル

タスクイベントは次の両方に書き込まれます。

- `DATA_ROOT/jobs/{job_id}/logs/events.jsonl`

## 4. 現在の設計上の約束

- `DATA_ROOT` が唯一のランタイムストレージルート
- Rust がタスクディレクトリを割り当て
- Python worker は Rust から渡されたパスのみを消費
- SQLite は現在 `jobs` / `events` / `artifacts` の 3 種の永続化を担当
