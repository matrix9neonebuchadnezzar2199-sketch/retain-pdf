# Provider 検証 API

## 1. MinerU Token 検証

`POST /api/v1/providers/mineru/validate-token`

用途: OCR 設定保存・タスク投入前に `mineru_token` の有効性を確認。実行中まで待たずに無効・期限切れを検出。

## 2. リクエストボディ

```json
{
  "mineru_token": "mineru-xxxx",
  "base_url": "https://mineru.net",
  "model_version": "vlm"
}
```

- `mineru_token`: 必須
- `base_url`: 任意、既定 `https://mineru.net`
- `model_version`: 任意、既定 `vlm`

## 3. 返却構造

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "ok": false,
    "status": "expired",
    "summary": "MinerU Token の有効期限が切れています",
    "retryable": false,
    "provider_code": "A0211",
    "provider_message": "token expired",
    "operator_hint": "新しい Token に差し替えてください",
    "trace_id": "trace-1",
    "base_url": "https://mineru.net",
    "checked_at": "2026-04-06T08:30:00Z"
  }
}
```

## 4. `status` の固定値

- `valid` — 利用可能
- `unauthorized` — 無効
- `expired` — 期限切れ
- `network_error` — 本機から MinerU への到達性失敗
- `provider_error` — 上記以外の MinerU エラー

## 5. フロントの使い方

1. Token 入力・更新
2. 本 API を呼ぶ
3. `data.status` で即時表示
4. `valid` のときだけ OCR/翻訳タスクを続行

表示: 成功は `summary`、失敗は `summary` + `operator_hint`。デバッグ時は `provider_code` 等を追加。

## 6. 実装約束

- MinerU への軽量プローブのみ。OCR タスクは作成しない。PDF はアップロードしない。
- 事前に token 無効・期限切れ・ネットワーク不通を検出。

## 7. 実行期失敗診断との関係

本 API は「事前検証」。実行中の MinerU 認証問題は失敗診断が `A0202` / `A0211` を引き続き識別。両者は補完関係。
