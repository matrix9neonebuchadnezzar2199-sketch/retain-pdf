# 03 Semantics Rules

## 総原則

フィールドは次の 3 類に分類:

1. 安定構造
2. 安定意味論
3. 排查専用 raw trace

## コア構造層に入れてよいもの

provider を跨いでも安定しそうなもののみ:

- `type`, `sub_type`, `bbox`, `text`, `lines`, `segments`, `tags`, `derived`, `continuation_hint`

## `tags`

軽量で組み合わせ可能な構造ヒント。例: `title`, `abstract`, `heading`, `caption`, `reference_zone`, `skip_translation`, `image`, `table`, `formula`

## `derived`

より強い意味論結論。提供者を明記。

```json
{
  "role": "title",
  "by": "provider_rule",
  "confidence": 0.98
}
```

## `metadata/source` に留めるもの

Paddle 私有はまず trace 層:

- `raw_group_id`, `raw_global_group_id`, `raw_global_block_id`, `raw_block_order`, `raw_polygon`
- `layout_det_*`, `model_settings`, `markdown.images`

複数 provider で安定し下流が必要なときだけ昇格を検討。

## trace 分层

1. コア構造
2. 共通 trace（`content_format`, `asset_*`, `markdown_match_*` 等）
3. provider raw trace

## ルール変更時

`block_label -> type/sub_type/tags/derived` を変える場合は同時に:

1. 本ディレクトリのドキュメント
2. 関連 fixture
3. regression check
4. 必要なら translation extractor smoke
