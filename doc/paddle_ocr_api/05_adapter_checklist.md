# 05 Adapter Checklist

## タスク定義

### 入力

- Paddle OCR 生 JSON
- 最小 fixture 1 つ以上
- より完全な fixture 1 つ以上

### 出力

- 登録可能な Paddle adapter
- `document.v1` 出力
- 対応ドキュメントとテスト

## 変更可能範囲

- `doc/paddle_ocr_api/*`
- `backend/scripts/services/document_schema/provider_adapters/paddle/*`
- `adapters.py`, `providers.py`
- `backend/scripts/devtools/tests/document_schema/fixtures/*`
- `regression_check.py`

変更しない:

- `services/translation/*`
- `services/rendering/*`
- `runtime/pipeline/*`

例外: メイン契約に安定フィールド追加が本当に必要なときは `document_schema` へ先に提案。

## 接続順序

1. Paddle 生返却形式の確認
2. トップ/ページ/block フィールド整理
3. 配置方針の確定
4. detector 実装
5. adapter 実装
6. `continuation_hint` マッピング
7. fixture 追加
8. 回帰実行
9. ドキュメント更新

## 検証コマンド

```bash
PYTHONPATH=backend/scripts python backend/scripts/devtools/tests/document_schema/regression_check.py
PYTHONPATH=backend/scripts python -m pytest backend/scripts/devtools/tests/document_schema -q
PYTHONPATH=backend/scripts python -m pytest backend/scripts/devtools/tests/translation -q
```

## 必須確認

- provider 検出の安定性
- `document.v1` の schema 検証
- `source.provider == paddle`
- `type/sub_type/tags/derived` の契約適合
- 必要 trace が `metadata/source` に残っている
- `continuation_hint` は信頼できるときだけ
- `skip_translation` はスキップ対象 block のみ

## 提出テンプレート

1. 対応した Paddle API 返却形式
2. 使用 fixture
3. 追加・変更したマッピング
4. 意図的に接続しない Paddle フィールド
5. `continuation_hint` を書いたか
6. テストコマンドと結果
