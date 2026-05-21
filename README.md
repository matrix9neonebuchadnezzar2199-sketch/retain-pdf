# RetainPDF：レイアウト保持 PDF 翻訳ツール（日本語 UI 版）

<p align="center">
  <img src="image/RetainPDF-github.svg" alt="RetainPDF" width="320" />
</p>

本リポジトリは [wxyhgk/retain-pdf](https://github.com/wxyhgk/retain-pdf) をフォークし、**ブラウザ／デスクトップ UI を日本語化**した版です。バックエンドの挙動・API は上流と同一です。

オープンソースのレイアウト保持系ツールの多くは、コピー可能で編集しやすい PDF や、行内数式が単純な文書を前提にしています。

RetainPDF は最初から、画像型／スキャン PDF や複雑な行内数式のレンダリングを含む、幅広い PDF のレイアウト保持翻訳を対象にしています。

同分野ではクローズドモデルと正面から競合し、訳 PDF のサイズ・速度・フォントサイズ制御などで優れる場面もあります。

フロント／バックエンド分離、OCR、翻訳、組版、成果物配信までを一気通貫でつなぐフルスタック構成で、モジュール差し替えや二次開発しやすいよう疎結合を意識しています。

## 機能比較（概要）

| プロジェクト | スキャン PDF | 複雑な行内数式 | コード誤訳防止 | 表制御 | 翻訳ルール | レイアウト保持 | PDF 圧縮 | API 自動化 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PDFMathTranslate | ❌ | ❌ | ❌ | 弱 | 弱 | 一般 | 一般 | ✅ |
| PolyglotPDF | ❌ | ❌ | ❌ | 弱 | 弱 | 一般 | 一般 | ✅ |
| Doc2X | ✅ | ✅ | ❌ | 中 | 弱 | 強 | 弱 | ❌ 非公開 |
| RetainPDF | ✅ | ✅ | ✅ | ✅ 切替可 | ✅ ルール設定 | 強 | ✅ 継続改善 | ✅ |

## スクリーンショット

### 学術論文（SCI）

<p align="center">
  <img src="image/image%201.png" alt="SCI サンプル 1" width="860" />
</p>

<p align="center">
  <img src="image/image%202.png" alt="SCI サンプル 2" width="860" />
</p>

### 画像型／スキャン PDF

<p align="center">
  <img src="image/image%203.png" alt="スキャン版サンプル 1" width="860" />
</p>

<p align="center">
  <img src="image/image%207.png" alt="スキャン版サンプル 2" width="860" />
</p>

### 書籍系

<p align="center">
  <img src="image/image%204.png" alt="書籍サンプル 1" width="860" />
</p>

<p align="center">
  <img src="image/image%205.png" alt="書籍サンプル 2" width="860" />
</p>

<p align="center">
  <img src="image/image%206.png" alt="書籍サンプル 3" width="860" />
</p>

## クイックスタート

利用のみの場合は [GitHub Releases](https://github.com/wxyhgk/retain-pdf/releases) から配布物を取得してください（本フォーク独自の Release は未整備の場合があります）。

- Windows: `Setup.exe` 推奨
- macOS: `.dmg`
- Linux: `.deb`

LAN・チーム向けには Docker デプロイを推奨します。

### Windows デスクトップ

<p align="center">
  <img src="image/RetainPDF-desktop.png" alt="RetainPDF Windows デスクトップ" width="860" />
</p>

### macOS の注意

Apple 開発者アカウント未登録のため、初回起動時に「破損しています」と表示されることがあります。実ファイルの破損ではなく署名検証によるものです。`/Applications` に配置後:

```bash
sudo xattr -r -d com.apple.quarantine /Applications/RetainPDF.app
```

その後、再度アプリを開いてください。

### Docker

- [docker/delivery/README.md](docker/delivery/README.md)
- [docker/delivery/docker-compose.yml](docker/delivery/docker-compose.yml)

```bash
git clone https://github.com/matrix9neonebuchadnezzar2199-sketch/retain-pdf.git
cd retain-pdf/docker/delivery
docker compose up -d
```

起動後の既定 URL:

```text
http://127.0.0.1:40001
```

既定ポート:

- `40001` — フロントエンド
- `41000` — Rust API
- `42000` — 簡易同期 API

### Docker の更新

```bash
cd retain-pdf/docker/delivery
docker compose pull
docker compose up -d
```

特定イメージタグを指定する例:

```bash
cd retain-pdf/docker/delivery
APP_IMAGE=wxyhgk/retainpdf-app:latest \
WEB_IMAGE=wxyhgk/retainpdf-web:latest \
docker compose up -d
```

```bash
docker compose ps
```

Docker イメージ:

- [wxyhgk/retainpdf-app](https://hub.docker.com/r/wxyhgk/retainpdf-app)
- [wxyhgk/retainpdf-web](https://hub.docker.com/r/wxyhgk/retainpdf-web)

## 開発者向け

### 日本語 UI フォークについて

- 文言の変更は主に `frontend/` 配下（HTML・Web Components・JS）
- 上流の中国語 README は `README.zh-CN.md` に退避（初回日本語化時に追加）
- `doc/` 配下の技術ドキュメントは日本語化済み（プロジェクト README の中国語版は `README.zh-CN.md`）

### ローカル起動（フロントのみ確認）

```bash
cd frontend
# 静的配信または docker/delivery の compose で全体起動
```

Playwright（OCR 再スキャン等）を使う場合:

```bash
uv run playwright install chromium
```

### ドキュメント（日本語）

- [API ドキュメント](doc/API.md)
- [doc 目次](doc/README.md)
- [ローカル起動と設定](doc/api-dev.md)
- [トラブルシュート](doc/api-troubleshooting.md)
- [Docker デプロイ](docker/delivery/README.md)

### ディレクトリ構成

- `frontend/` — ブラウザ UI、デスクトップシェル、実験ページ
- `backend/` — Rust API、Python スクリプト、旧 FastAPI ラッパー
- `docker/` — Dockerfile、compose
- `data/` — ローカル出力・タスクデータ

## ライセンス

MIT License — 詳細は [LICENSE](LICENSE) を参照してください。
