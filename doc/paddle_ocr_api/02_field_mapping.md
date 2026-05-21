# 02 Field Mapping

## 原則

問い: この Paddle フィールドは `document.v1` のどの層に置くか。

許可される層:

1. コア: `type/sub_type/bbox/text/lines/segments/tags/derived`
2. 共通 trace: 複数 provider 共用の `metadata`
3. provider raw trace: Paddle 私有、`metadata/source`

## トップマッピング

| Paddle | `document.v1` | 説明 |
| --- | --- | --- |
| provider 固定 | `source.provider` | 現在 `paddle` |
| 入力パス | `source.raw_files.source_json` | adapter 外から注入 |
| ページ数 | `page_count` | pages 数 |

## ページマッピング

| Paddle | `document.v1` | 説明 |
| --- | --- | --- |
| `dataInfo.pages[i].width` | `pages[i].width` | 第一候補 |
| `dataInfo.pages[i].height` | `pages[i].height` | 第一候補 |
| `prunedResult.width/height` | `pages[i].width/height` | フォールバック |
| ページ番号 | `pages[i].page_index` | 0 始まり |
| 固定 | `pages[i].unit` | 現在 `pt` |

## block マッピング

| Paddle | `document.v1` | 説明 |
| --- | --- | --- |
| `block_bbox` | `bbox` | 正規化 bbox |
| `block_content` | `text` | 正規化テキスト |
| `block_label` | `type/sub_type/tags` | `block_labels.py` |
| 行/段分割 | `lines/segments` | `content_extract.py` |
| `block_id` | `source.raw_block_id` | 生 ID 保持 |
| `block_label` | `source.raw_type` | 生タイプ |
| `block_bbox` | `source.raw_bbox` | 生 bbox |
| `block_content[:200]` | `source.raw_text_excerpt` | 排查用 |
| 生 JSON パス | `source.raw_path` | 参照パス |

## label マッピング例

`block_labels.py` 参照:

| `block_label` | `type` | `sub_type` | `tags` |
| --- | --- | --- | --- |
| `doc_title` | `text` | `title` | `title` |
| `abstract` | `text` | `abstract` | `abstract` |
| `text` | `text` | `body` | （空） |
| `paragraph_title` | `text` | `heading` | `heading` |
| `reference_content` | `text` | `reference_entry` | `reference_entry, reference_zone, skip_translation` |
| `formula_number` | `text` | `formula_number` | `formula_number, skip_translation` |
| `table` | `table` | `table_html` | `table` |
| `image` | `image` | `image_body` | `image, skip_translation` |
| `algorithm` | `code` | `code_block` | `code` |
| `display_formula` | `formula` | `display_formula` | `formula` |

## `derived`

`trace.py` の provider ルール例:

- `doc_title` → `derived.role = title`
- `abstract` → `abstract`
- `reference_content` → `reference_entry`
- `formula_number` → `formula_number`
- `header/footer` → `header` / `footer`

## 禁止

1. Paddle 私有を新しいメイン契約フィールドに直挿入しない
2. translation 層で `block_label` を再解釈しない
3. 単一 fixture のためだけに `type/sub_type` 意味を変えない
