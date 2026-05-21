# 01 Response Shape

## トップ構造

Paddle adapter が依存する主フィールド:

- `layoutParsingResults` — ページ単位の解析結果リスト
- `dataInfo` — ページサイズ等
- `preprocessedImages` — 任意

最小識別条件: `backend/scripts/services/document_schema/provider_adapters/paddle/adapter.py`

## ページ構造

各ページで主に読む:

- `prunedResult`
- `prunedResult.parsing_res_list`
- `prunedResult.layout_det_res.boxes`
- `markdown.text`
- `markdown.images`

ページサイズの優先順:

1. `dataInfo.pages[i].width / height`
2. `prunedResult.width / height`
3. 欠損時 `0`

## block 構造

- `block_label`, `block_bbox`, `block_content`, `block_polygon_points`
- `block_id`, `group_id`, `global_block_id`, `global_group_id`, `block_order`

- `block_label` → 主構造マッピング
- `block_content` → テキスト主ソース
- `group_id` / `global_group_id` / `block_order` → 主に `continuation_hint`

## ページ構築フロー

1. `layoutParsingResults[page_index]` を読む
2. `PaddlePageContext` を構築
3. `parsing_res_list` から block spec を逐次構築
4. ページ `metadata` を補完
5. common builder で `document.v1` 生成

入口: `payload_reader.py`, `page_reader.py`

## メンテナンス

Paddle API 構造変更時は本ファイルを優先更新:

1. トップフィールド
2. ページフィールドパス
3. block フィールドパス
4. 信頼できなくなったフィールド
