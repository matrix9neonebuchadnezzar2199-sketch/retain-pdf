# バックエンド API ドキュメント

本文書は、現在のバックエンドサービスの実際のインターフェース契約を記述する。対象は次の 3 種類の利用者である。

- フロントエンド連携担当者
- ローカルデプロイおよび運用担当者
- タスク失敗原因の調査が必要な開発者

関連ドキュメント：

- [フロントエンドリクエスト例](backend/rust_api/frontend_request_example.md)
- [OCR-only サービスドキュメント](backend/rust_api/MinerU_OCR_Service_API.md)
- [API 総合入口](doc/API.md)

## 1. サービス概要

現在のバックエンドは 2 層構成である。

- Rust：対外 HTTP API、認証、タスクキューイング、タスク状態の永続化、OCR provider transport
- Python：OCR 標準化、翻訳、レンダリング、PDF 成果物生成

メインタスクの処理フロー：

1. PDF をアップロード
2. メインタスクを作成 `POST /api/v1/jobs`
3. メインタスク内部で OCR サブタスク `{job_id}-ocr` を作成
4. OCR サブタスク完了後、標準化された `document.v1.json` を生成
5. メインタスクが翻訳とレンダリングを継続
6. PDF / Markdown / ZIP をダウンロード

デフォルトポート：

- `41000`：フル API
- `42000`：簡易同期インターフェース

ベースパス：

- ヘルスチェック：`GET /health`
- ビジネスプレフィックス：`/api/v1`

## 2. 認証と設定

`GET /health` を除くすべてのインターフェースは、デフォルトで次を要求する。

```http
X-API-Key: your-rust-api-key
```

2 種類のキーを区別すること：

- `X-API-Key`：Rust API 自体へのアクセス
- リクエストボディ内の `api_key`：下流モデルサービスへのアクセス

ローカル環境での推奨設定ファイル：

- `backend/rust_api/auth.local.json`

例：

```json
{
  "api_keys": ["replace-with-your-backend-key"],
  "max_running_jobs": 4,
  "simple_port": 42000
}
```

よく使う環境変数：

- `RUST_API_BIND_HOST`：リッスンアドレス、デフォルト `0.0.0.0`
- `RUST_API_PORT`：フル API ポート、デフォルト `41000`
- `RUST_API_SIMPLE_PORT`：簡易同期インターフェースポート、デフォルト `42000`
- `RUST_API_KEYS`：バックエンドで許可する API key リスト（カンマ区切り）
- `RUST_API_MAX_RUNNING_JOBS`：同時実行タスク数、デフォルト `4`
- `RUST_API_DATA_ROOT`：データルートディレクトリ
- `PYTHON_BIN`：Python 実行ファイル、デフォルト `python`

設定の優先順位：

1. コードのデフォルト値
2. ローカル設定ファイル
3. 環境変数
4. 起動引数
5. リクエストボディのホワイトリスト業務パラメータ

リクエストボディでは、パス、ポート、データルートディレクトリなどのインフラ設定を上書きできない。

## 3. ストレージ規約

現在のランタイムでは `DATA_ROOT` を唯一のデータルートディレクトリとする。デフォルトはリポジトリ配下の `data/` である。

主要ディレクトリ：

- `DATA_ROOT/uploads/`：アップロードファイル
- `DATA_ROOT/jobs/{job_id}/`：タスク作業ディレクトリ
- `DATA_ROOT/downloads/`：ダウンロードキャッシュ
- `DATA_ROOT/db/jobs.db`：SQLite

タスクディレクトリの標準構造：

- `source/`
- `ocr/`
- `translated/`
- `rendered/`
- `artifacts/`
- `logs/`

データベース内部は次のように分割されている。

- `jobs`：タスクメタ情報、状態、エラー、ログ末尾
- `artifacts`：成果物インデックス
- `events`：構造化イベントストリーム

データベースおよびインターフェースの返却値は相対パスを主とし、実行時に実ファイルへ解決する。

## 4. 統一レスポンス形式

成功：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失敗：

```json
{
  "code": 400,
  "message": "具体的なエラーメッセージ"
}
```

規約：

- `code = 0` は成功を表す
- `message` はフロントエンドユーザーへ直接表示するのに適している
- 業務詳細は `data` に含まれる

## 5. メインフローインターフェース

### 5.1 PDF アップロード

`POST /api/v1/uploads`

`multipart/form-data` フィールド：

- `file`：必須、PDF ファイル
- `developer_mode`：任意、`true/false`

成功例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "upload_id": "20260402073151-a80618",
    "filename": "paper.pdf",
    "bytes": 1832451,
    "page_count": 18,
    "uploaded_at": "2026-04-02T07:31:55+08:00"
  }
}
```

現在のアップロード制限：

- 通常モード：デフォルトでは `10MB` 以内、`30` ページ以内のみサポート
- `developer_mode=true`：通常モードの制限をスキップ
- MinerU provider のハード制限は引き続き `200MB` 未満かつ `600` ページ以内

### 5.2 メインタスク作成

`POST /api/v1/jobs`

現在の canonical JSON リクエストボディはグループ化構造であり、旧来のフラット JSON は受け付けない。

```json
{
  "workflow": "mineru",
  "source": {
    "upload_id": "20260402073151-a80618"
  },
  "ocr": {
    "provider": "mineru",
    "mineru_token": "mineru-xxxx",
    "page_ranges": ""
  },
  "translation": {
    "mode": "sci",
    "model": "deepseek-chat",
    "base_url": "https://api.deepseek.com/v1",
    "api_key": "sk-xxxx",
    "skip_title_translation": false,
    "batch_size": 1,
    "workers": 50,
    "rule_profile_name": "general_sci",
    "custom_rules_text": "",
    "glossary_id": "",
    "glossary_entries": []
  },
  "render": {
    "render_mode": "auto",
    "compile_workers": 8
  },
  "runtime": {
    "job_id": "",
    "timeout_seconds": 1800
  }
}
```

現在サポートされている `workflow`：

- `mineru`：フルパイプライン、OCR -> Normalize -> Translate -> Render
- `translate`：OCR -> Normalize -> Translate、レンダリングには進まない
- `render`：既存 job artifacts に基づきレンダリングを再実行

インターフェースの境界：

- `POST /api/v1/jobs` は `mineru` / `translate` / `render` 向け
- `workflow=ocr` は独立エントリ `POST /api/v1/ocr/jobs` を使用

workflow ごとの `source` 規約：

- `mineru` / `translate`：通常 `source.upload_id` を使用
- `render`：`source.artifact_job_id` を使用

現在の必須フィールドは workflow と provider によって決まる。一般的な要件：

- `mineru` / `translate` で MinerU を使用する場合、`ocr.mineru_token` が必要
- 大規模言語モデルによる翻訳が必要な場合、`translation.base_url`、`translation.api_key`、`translation.model` が必要
- `render` workflow では OCR または翻訳の認証情報は不要

よく使う翻訳制御フィールド：

- `translation.skip_title_translation=false`：タイトルを翻訳
- `translation.skip_title_translation=true`：タイトル翻訳をスキップし、原文タイトルを保持

現在の検証ルール：

- `translation.base_url` は `http://` または `https://` で始まる必要がある
- `translation.api_key` は URL のように見えてはならない
- workflow / provider が MinerU の場合、`200MB / 600 ページ` 制限を追加検証する

用語集 v1 規約：

- `translation.glossary_id`：任意、バックエンドに保存済みの命名用語集を参照
- `translation.glossary_entries`：任意、タスクと同時に送信する用語エントリ配列。要素構造は `{source, target, note}`
- 両方を同時に送信した場合、バックエンドはまず命名用語集を読み込み、続けて inline 用語で `source` を正規化して上書きする
- v1 ではプロンプト注入と結果記録のみ行い、翻訳後の強制置換は行わない
- フロントエンドでユーザーに Excel をアップロードさせる場合、先にフロントエンドで JSON に解析してからバックエンドへ送信すること。バックエンドは JSON エントリのみ、または下記 CSV 解析補助インターフェース経由で `csv_text` を受け付ける
- 翻訳完了後、`translation-manifest.json`、診断ファイル、pipeline summary に用語集ヒット概要が付加される

互換性に関する注記：

- `POST /api/v1/jobs` の JSON エントリはグループ化構造のみ受け付ける
- 歴史的なフラットフィールドは、少数の `multipart/form-data` 補助エントリのフォームマッピングにのみ残存し、正式な JSON 契約とはみなされない

### 5.2.1 用語集リソースインターフェース

命名用語集インターフェース：

- `POST /api/v1/glossaries`
- `GET /api/v1/glossaries`
- `GET /api/v1/glossaries/{glossary_id}`
- `PUT /api/v1/glossaries/{glossary_id}`
- `DELETE /api/v1/glossaries/{glossary_id}`
- `POST /api/v1/glossaries/parse-csv`

作成または更新リクエストボディ：

```json
{
  "name": "semiconductor",
  "entries": [
    {"source": "band gap", "target": "带隙", "note": "materials"},
    {"source": "density of states", "target": "态密度", "note": ""}
  ]
}
```

返却フィールド：

- `glossary_id`
- `name`
- `entry_count`
- `entries`
- `created_at`
- `updated_at`

CSV 解析補助インターフェースのリクエストボディ：

```json
{
  "csv_text": "source,target,note\nband gap,带隙,materials\n"
}
```

このインターフェースは CSV テキストを標準 JSON エントリに解析するのみであり、Excel ファイルを直接受け付けることはない。

### 5.3 タスク詳細の照会

`GET /api/v1/jobs/{job_id}`

フロントエンドがポーリングするメインインターフェース。主要フィールド：

- `status`
- `stage`
- `stage_detail`
- `progress`
- `timestamps`
- `request_payload`
- `actions`
- `artifacts`
- `glossary_summary`
- `ocr_job`
- `runtime`
- `failure`
- `error`
- `failure_diagnostic`
- `normalization_summary`
- `log_tail`

説明：

- フロントエンドは `status` でタスク終了を判定すべき
- フロントエンドは `actions.*.enabled` と `artifacts.*.ready` でダウンロードボタンの有効性を判定すべき
- `failure` は構造化失敗情報の正本（source of truth）、`failure_diagnostic` は旧フロントエンド向けの簡略ビュー
- `runtime.stage_history` は「タスク段階がどう遷移し、各段階にどれだけ時間がかかったか」に答える
- 進捗パーセンテージからタスク完了を推測してはならない

### 5.4 タスク一覧の照会

`GET /api/v1/jobs`

一覧ページ向け。各項目の返却値：

- `job_id`
- `display_name`
- `workflow`
- `status`
- `trace_id`
- `stage`
- `created_at`
- `updated_at`
- `detail_path`
- `detail_url`

### 5.5 イベントストリームの照会

`GET /api/v1/jobs/{job_id}/events`

クエリパラメータ：

- `limit`
- `offset`

各イベントに含まれるフィールド：

- `job_id`
- `seq`
- `ts`
- `level`
- `stage`
- `event`
- `message`
- `payload`

イベント契約：

- 結果は `seq` 昇順で返却される
- `seq` は同一タスク内の単調増加シーケンス番号
- `stage` はイベント発生時の現在段階を表す
- `/events` は障害調査時の追加型イベント正本
- `runtime.stage_history` は詳細ページ内の段階タイムライン正本

イベントストリームは次のパスにも永続化される。

- `DATA_ROOT/jobs/{job_id}/logs/events.jsonl`

### 5.6 成果物マニフェストの照会

`GET /api/v1/jobs/{job_id}/artifacts-manifest`

このインターフェースは正式な成果物ディスカバリエントリである。各エントリには少なくとも次が含まれる。

- `artifact_key`
- `artifact_group`
- `artifact_kind`
- `ready`
- `content_type`
- `relative_path`
- `source_stage`
- `resource_path`
- `resource_url`

フロントエンドまたはスクリプトは優先的に次を実行すべき：

1. `artifacts-manifest` を照会
2. 対象の `artifact_key` を特定
3. `ready` を判定
4. `resource_path` / `resource_url` を使用

補足：

- `artifacts` 詳細ブロックはページ上でボタン状態を直接判定するのに適している
- `artifacts-manifest` は完全な機械的ディスカバリおよびダウンロードマッピングに適している

### 5.7 成果物のダウンロード

メインタスクのダウンロードインターフェース：

- `GET /api/v1/jobs/{job_id}/pdf`
- `GET /api/v1/jobs/{job_id}/markdown`
- `GET /api/v1/jobs/{job_id}/markdown?raw=true`
- `GET /api/v1/jobs/{job_id}/markdown/images/*path`
- `GET /api/v1/jobs/{job_id}/download`
- `GET /api/v1/jobs/{job_id}/normalized-document`
- `GET /api/v1/jobs/{job_id}/normalization-report`

フロントエンドはタスク詳細の返却値を優先的に読み取るべき：

- `actions.download_pdf`
- `actions.open_markdown`
- `actions.open_markdown_raw`
- `actions.download_bundle`
- `artifacts.pdf`
- `artifacts.markdown`
- `artifacts.bundle`

補足：

- `artifacts.pdf` / `artifacts.markdown` / `artifacts.bundle` などのネストオブジェクトが現在推奨される読み取りフィールド
- 同レベルの `pdf_url` / `markdown_url` / `bundle_url` などのフィールドは互換エイリアスとして残存し、意味的には path alias に近い。新規フロントエンドの主要読み取りフィールドとしては非推奨

`ready=false` または `enabled=false` の場合、ダウンロードリンクを独自に組み立てて強制アクセスしてはならない。

### 5.8 タスクのキャンセル

`POST /api/v1/jobs/{job_id}/cancel`

現在のセマンティクス：

- キュー待ちタスクはキャンセル済みとしてマークされる
- 実行中タスクはキャンセルフローに入る
- 完了済みタスクはロールバックされない

## 6. OCR-only インターフェース

OCR のみ実行し、翻訳とレンダリングを行わない場合に適する：

- `POST /api/v1/ocr/jobs`
- `GET /api/v1/ocr/jobs`
- `GET /api/v1/ocr/jobs/{job_id}`
- `GET /api/v1/ocr/jobs/{job_id}/events`
- `GET /api/v1/ocr/jobs/{job_id}/artifacts`
- `GET /api/v1/ocr/jobs/{job_id}/artifacts-manifest`
- `GET /api/v1/ocr/jobs/{job_id}/normalized-document`
- `GET /api/v1/ocr/jobs/{job_id}/normalization-report`
- `POST /api/v1/ocr/jobs/{job_id}/cancel`

メインタスク詳細の `ocr_job` フィールドは OCR サブタスクの概要を提供する：

- `job_id`
- `status`
- `trace_id`
- `provider_trace_id`
- `detail_url`

## 7. 簡易同期インターフェース

`POST http://host:42000/api/v1/translate/bundle`

用途：

- 1 リクエストで PDF を直接アップロードし、結果を待機
- 最終 ZIP またはタイムアウトエラーを返却

適している用途：

- 内部ツール
- 小規模スクリプト
- アップロード + ポーリング + ダウンロードの 3 段階フローを自前管理したくない呼び出し元

適さない用途：

- リアルタイム進捗表示が必要なフロントエンドページ
- 詳細な障害調査が必要なシナリオ

## 8. 状態と段階

`status` の現在の取りうる値：

- `queued`
- `running`
- `succeeded`
- `failed`
- `canceled`

メインタスクでよく見られる `stage`：

- `queued`
- `ocr_submitting`
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
- `canceled`

`stage_detail` は現在ユーザーへ表示するのに最も推奨される段階説明であり、`stage` より粒度が細かい。

## 9. 失敗診断

`GET /api/v1/jobs/{job_id}` は失敗時、通常次を返却する。

- `failure.stage`：構造化失敗段階
- `failure.category`：構造化失敗分類
- `failure.summary`：構造化失敗概要
- `failure.retryable`：再試行を推奨するか
- `failure.root_cause`：特定された根本原因
- `failure.suggestion`：推奨アクション
- `failure_diagnostic.failed_stage`：旧フロントエンド向け失敗段階フィールド
- `failure_diagnostic.error_kind`：旧フロントエンド向け失敗種別フィールド
- `error`：生のエラー概要
- `log_tail`：直近ログ末尾

現在重点的にカバーされているエラー種別：

- 認証エラー：例 `missing or invalid X-API-Key`
- 設定エラー：例 `mineru_token`、`api_key`、`model` の欠落
- ネットワークエラー：例 DNS 解決失敗、リモート切断、リクエストタイムアウト
- OCR provider transport エラー：アップロード URL 申請失敗、ポーリング失敗、bundle ダウンロード失敗
- Python worker エラー：標準化、翻訳、レンダリング段階の例外

フロントエンドへの推奨：

- 失敗時はまず `failure.summary` を表示
- 続けて `failure.suggestion` を表示
- フロントエンドが新フィールドへ未移行の場合、`failure_diagnostic.summary` を引き続き読み取れる
- 開発モードでは `log_tail` を併記

## 10. よくあるトラブルシューティング

### 10.1 タスク失敗だがフロントエンドは「タスク失敗」のみ表示

優先的に確認：

1. `GET /api/v1/jobs/{job_id}`
2. `failure_diagnostic`
3. `log_tail`
4. `GET /api/v1/jobs/{job_id}/events`

### 10.2 ダウンロードボタンが無効

先に確認：

- `status` が終了状態か
- `actions.*.enabled` が `true` か
- `artifacts.*.ready` が `true` か

状態が `running` であるだけを理由に、ファイルが既に存在すると推測してはならない。

### 10.3 MinerU 関連の失敗

一般的な原因：

- `mineru_token` の欠落または期限切れ
- アップロード PDF が MinerU 制限を超過
- DNS またはプロキシ環境の異常
- リモート API の一時的切断または CDN 取得失敗

### 10.4 DNS / ネットワーク異常

典型的なエラーメッセージ：

- `Temporary failure in name resolution`
- `Server disconnected without sending a response`
- `Failed to fetch`

この種の問題は通常フロントエンドではなく、バックエンドホストのネットワーク、プロキシ、または DNS 設定にある。

## 11. 連携の推奨

フロントエンドで最も堅牢な呼び出し方法：

1. `POST /api/v1/uploads`
2. `POST /api/v1/jobs`
3. `GET /api/v1/jobs/{job_id}` をポーリング
4. 成功後 `actions` / `artifacts` を読み取ってからダウンロード
5. 失敗時は `failure_diagnostic` と `log_tail` を表示

最小実装のみ必要な場合は、次を直接参照：

- [frontend_request_example.md](backend/rust_api/frontend_request_example.md)
