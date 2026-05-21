# ローカル起動と設定

## 1. バックエンドの起動

```bash
cd backend/rust_api
RUST_API_BIND_HOST=0.0.0.0 \
DATA_ROOT=../data \
RUST_API_SCRIPTS_DIR=../scripts \
cargo run
```

## 2. フロントエンドの起動

```bash
cd frontend
python3 -m http.server 8080 --bind 0.0.0.0
```

## 3. 認証

`GET /health` を除き、他のエンドポイントはデフォルトで次が必要です。

```http
X-API-Key: your-rust-api-key
```

区別して理解すること:

- `X-API-Key`: Rust API 自体へのアクセス用バックエンド資格情報
- リクエストボディの `api_key`: 下流モデルサービスの API Key
- リクエストボディの `mineru_token`: MinerU Token

## 4. ローカル key の取得元

ローカルバックエンド key は通常次から取得します。

- `backend/rust_api/auth.local.json`
- または環境変数 `RUST_API_KEYS`

## 5. よく使う環境変数

- `RUST_API_BIND_HOST`
- `DATA_ROOT`
- `RUST_API_SCRIPTS_DIR`
- `RUST_API_PORT`
- `RUST_API_SIMPLE_PORT`
