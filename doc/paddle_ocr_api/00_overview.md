# 00 Overview

## 目標

Paddle OCR 連携層の目標:

- 入力: Paddle OCR 生 JSON
- 出力: 現行メイン契約に合致する `normalized_document_v1`

つまり:

`Paddle raw payload -> provider adapter -> document.v1 -> translation/rendering`

## 現在の識別条件

次を満たす payload を Paddle とみなす:

- トップが `dict`
- `layoutParsingResults` がある
- `dataInfo` がある

コード:

- `backend/scripts/services/document_schema/provider_adapters/paddle/adapter.py`
- `backend/scripts/services/document_schema/adapters.py`

## ディレクトリ責務

`provider_adapters/paddle/`:

- `adapter.py` — 総入口
- `payload_reader.py` — トップ payload とページ spec
- `page_reader.py` — page context / page spec
- `block_reader.py` — block context / block spec
- `block_labels.py` — `block_label -> type/sub_type/tags`
- `trace.py` — `metadata/source/derived`
- `continuation.py` — グループ情報 → `continuation_hint`
- `page_trace.py` — ページ trace と layout_det 照合
- `rich_content.py` 等 — リッチコンテンツ trace 集約

## 担当者の境界

担当:

1. Paddle 生フィールドの解釈
2. フィールド配置ルール
3. `block_label` 意味論マッピング
4. `continuation_hint` マッピング
5. fixture と回帰

タスクに含めない:

1. 翻訳プロンプト
2. 組版上書き
3. PDF 書き戻し
4. フロント表示

## 受け入れ基準

1. `adapt_path_to_document_v1()` が Paddle raw JSON を `document.v1` に変換できる
2. `validate_document_payload()` が通る
3. `extract_text_items()` smoke が通る
4. fixture が回帰に登録済み
5. ドキュメント更新済み
