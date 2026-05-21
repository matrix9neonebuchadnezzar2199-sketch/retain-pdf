
**課題**

外文の論文・教材・技術文書は情報密度が高い一方、読み解くコストも大きいです。

- 原文の読解ハードルが高く、効率が低い
- 一般的な翻訳ツールはプレーンテキスト中心で、数式・画像・組版が崩れやすい
- 訳後の成果物を整理・共有・アーカイブしにくい

**RetainPDF が行うこと**

PDF をアップロードし、ワンクリックで元の組版を保った日本語訳を取得します。

- 訳 PDF、Markdown、ZIP パッケージを用途に応じて取得
- Web UI、CLI、API のいずれでも利用可能
- 画像型 PDF（スキャン・スクリーンショット版）にも対応。編集可能 PDF だけではありません

**翻訳効果の例**

一般的な SCI 論文の翻訳例:

![一般的な SCI 論文の翻訳例](./g-1.png)

画像型 PDF の翻訳比較:

![画像型 PDF の翻訳比較](./g-2.png)

**類似ソリューションとの違い**

- [PDFMathTranslate](https://github.com/PDFMathTranslate/PDFMathTranslate) との比較: 画像型 PDF の弱点を補い、行内数式と本文の接続が自然になり、組版崩れの確率が低い
- Doc2X 等のクローズドソースとの比較: 自主デプロイ可能で API と成果物を自分で管理できる。実測でも全体品質が高い傾向
- 実運用では追加の手作業組版修正なしで近い完成度になることが多い




# 初めてのユーザー

サービスを起動するだけなら、次の手順で十分です。

## 1. マシン環境の確認

推奨環境:

- OS: `Linux` 優先。`Ubuntu 22.04` / `24.04` 推奨
- CPU アーキテクチャ: 現在のイメージは `x86_64` / `amd64` 向け（ARM 版ではない）
- CPU: 最低 4 コア
- メモリ: 最低 8GB、16GB 以上推奨
- ディスク: 空き 10GB 以上
- ネットワーク: Docker Hub、MinerU、利用するモデル API へ到達可能であること

補足:

- 本プロジェクトは主に CPU・メモリ・ネットワークを消費し、専用 GPU は不要
- `Mac M`、Raspberry Pi、ARM サーバーでは `x86_64` 互換実行環境の有無を先に確認
- 個人の軽利用なら `4 コア + 8GB` で起動可能
- 複数人同時利用なら `8 コア + 16GB` から検討

## 2. Docker のインストール

次がインストール済みであること:

- `docker`
- `docker compose`

インストール後の確認:

```bash
docker --version
docker compose version
```

## 3. GitHub からクローン

```bash
git clone https://github.com/wxyhgk/retain-pdf.git
cd retain-pdf
```

## 4. サービス起動

```bash
docker compose up -d
```

起動後のデフォルト URL:

```text
http://127.0.0.1:40001
```

# 上級ユーザー

## ファイルの役割

- `docker-compose.yml`
  Docker オーケストレーションの入口。デフォルトで Docker Hub イメージを pull し `app` + `web` を起動。
- `docker/app.env`
  バックエンド実行パラメータ。コンテナ内パス、フォント、ポート、並列数、アップロード制限を制御。
- `docker/web.env`
  Docker 公開版フロントの実行パラメータ。デフォルト注入するバックエンド key、モデル既定値など。
- `docker/auth.local.json`
  Rust API 認証ホワイトリスト。フロントと CLI はここに設定したバックエンド key が必要。

## よく変更する項目

### docker/auth.local.json

- `api_keys`
  Rust API が受理するバックエンド key のリスト。リクエストヘッダ `X-API-Key` はいずれかと一致必須。
- `max_running_jobs`
  同時実行タスク数の上限。
- `simple_port`
  簡易同期 API のコンテナ内待受ポート。既定 `42000`。通常はホストへ直接公開しない。

### docker/web.env

- `FRONT_API_BASE`
  フロント内部の API 基準 URL。通常は空のまま同源プロキシに任せる。
- `FRONT_X_API_KEY`
  フロントが自動付与する `X-API-Key`。`docker/auth.local.json` のいずれかと一致させる。
- `FRONT_MINERU_TOKEN`
  フロント既定の MinerU token。空なら利用者が UI で入力。
- `FRONT_MODEL_API_KEY`
  フロント既定のモデル API key。空なら利用者が入力。
- `FRONT_MODEL`
  既定モデル名。例: `deepseek-chat`
- `FRONT_BASE_URL`
  既定モデルサービス URL。例: `https://api.deepseek.com/v1`
- `FRONT_PROVIDER_PRESET`
  既定 provider プリセット。Docker 公開版は現在 `deepseek` のみ。

### docker/app.env

- `PROJECT_ROOT` — コンテナ内プロジェクトルート
- `RUST_API_ROOT` — Rust API ディレクトリ
- `RUST_API_DATA_DIR` — ランタイムデータ（アップロード、DB 等）
- `OUTPUT_ROOT` — タスク出力ルート
- `PYTHON_BIN` — Python スクリプト実行用インタプリタ
- `TYPST_BIN` — Typst 実行ファイルパス
- `RETAIN_PDF_FONT_PATH` — 既定日本語フォント
- `RETAIN_PDF_TYPST_FONT_FAMILY` — Typst 既定フォントファミリ
- `RUST_API_PORT` — 完全 API のコンテナ内ポート。既定 `41000`
- `RUST_API_SIMPLE_PORT` — 簡易同期 API。既定 `42000`
- `RUST_API_MAX_RUNNING_JOBS` — 最大同時実行数
- `RUST_API_NORMAL_MAX_BYTES` — 通常アップロード上限。本パッケージは `200MB`
- `RUST_API_NORMAL_MAX_PAGES` — 通常ページ上限。本パッケージは `600` ページ

## 補足

- ホストへ公開されるのは通常 `40001` のみ
- フロントは同源プロキシ経由でバックエンドへアクセス
- 一般ユーザーは `API Base` を理解する必要はない
- Docker 公開版フロントは現在 `DeepSeek` provider のみ
- UI の `200MB / 600 ページ` は MinerU 上流制限に由来し、これを超えられない
- コンテナ内には `41000`（完全 Rust API）と `42000`（簡易同期 API）が残るが、既定ではホストへマップしない

## 任意の既定値

フロントに下流設定を既定表示したい場合:

- `FRONT_MINERU_TOKEN`
- `FRONT_MODEL_API_KEY`
- `FRONT_MODEL`
- `FRONT_BASE_URL`

空のままなら、利用者が「API 設定」ダイアログで入力します。

## 独自イメージで起動する場合

```bash
APP_IMAGE=wxyhgk/retainpdf-app:latest \
WEB_IMAGE=wxyhgk/retainpdf-web:latest \
docker compose up -d
```

# 開発者

フロントではなく CLI で API を叩く場合の例です。

```bash
export HOST="http://127.0.0.1:40001"
export X_API_KEY="replace-with-your-backend-key"
export MINERU_TOKEN="your-mineru-token"
export MODEL_API_KEY="your-model-api-key"
export MODEL="deepseek-chat"
export BASE_URL="https://api.deepseek.com/v1"
```

## ヘルスチェック

```bash
curl "$HOST/health"
```

## PDF アップロード

```bash
curl -X POST "$HOST/api/v1/uploads" \
  -H "X-API-Key: $X_API_KEY" \
  -F "file=@/absolute/path/to/your.pdf"
```

返却例:

- `upload_id`
- `filename`
- `page_count`

## 非同期タスク作成

前段の `upload_id` を指定:

```bash
curl -X POST "$HOST/api/v1/jobs" \
  -H "X-API-Key: $X_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "mineru",
    "upload_id": "your-upload-id",
    "mode": "sci",
    "model": "'"$MODEL"'",
    "base_url": "'"$BASE_URL"'",
    "api_key": "'"$MODEL_API_KEY"'",
    "mineru_token": "'"$MINERU_TOKEN"'",
    "workers": 100,
    "batch_size": 1,
    "classify_batch_size": 12,
    "render_mode": "auto",
    "compile_workers": 8,
    "model_version": "vlm",
    "language": "ch",
    "rule_profile_name": "general_sci"
  }'
```

返却例:

- `job_id`
- `status`

## タスク状態の照会

```bash
curl -H "X-API-Key: $X_API_KEY" \
  "$HOST/api/v1/jobs/your-job-id"
```

重点フィールド:

- `status`
- `stage`
- `stage_detail`
- `progress`
- `actions`

終端状態の例: `succeeded`, `failed`, `canceled`

## 結果のダウンロード

PDF:

```bash
curl -L -H "X-API-Key: $X_API_KEY" \
  "$HOST/api/v1/jobs/your-job-id/pdf" \
  -o translated.pdf
```

Markdown:

```bash
curl -L -H "X-API-Key: $X_API_KEY" \
  "$HOST/api/v1/jobs/your-job-id/markdown?raw=true" \
  -o translated.md
```

ZIP:

```bash
curl -L -H "X-API-Key: $X_API_KEY" \
  "$HOST/api/v1/jobs/your-job-id/download" \
  -o result.zip
```

## タスクキャンセル

```bash
curl -X POST -H "X-API-Key: $X_API_KEY" \
  "$HOST/api/v1/jobs/your-job-id/cancel"
```

## 簡易同期 API

アップロード・タスク作成・ポーリングを自前で行わず、完了までブロックして ZIP を返す API。

注意:

- フロント同源プロキシ経由
- 既定パス `/api/v1/translate/bundle`
- 完了まで接続を保持し、最終的に ZIP を返す

```bash
curl -X POST "$HOST/api/v1/translate/bundle" \
  -H "X-API-Key: $X_API_KEY" \
  -F "file=@/absolute/path/to/your.pdf" \
  -F "mineru_token=$MINERU_TOKEN" \
  -F "base_url=$BASE_URL" \
  -F "api_key=$MODEL_API_KEY" \
  -F "model=$MODEL" \
  -F "mode=sci" \
  -F "workers=100" \
  -F "batch_size=1" \
  -o result.zip
```
