# 04 Continuation Hint

## 目標

Paddle が同一段落グループを既知なら、統一契約 `continuation_hint` に写す。

translation が Paddle の `group_id` / `global_group_id` / `block_order` を直接読まないようにする。

## 構造

```json
{
  "source": "provider",
  "group_id": "provider-paddle-global-xxx",
  "role": "head",
  "scope": "cross_page",
  "reading_order": 0,
  "confidence": 0.98
}
```

- `source`: provider 書き込み時は `provider`
- `group_id`: 連続組の安定 ID
- `role`: `single` / `head` / `middle` / `tail`
- `scope`: `intra_page` または `cross_page`
- `reading_order`: 組内順序
- `confidence`: provider の信頼度

## Paddle マッピング（`continuation.py`）

1. `raw_global_group_id` を優先
2. 無ければ `page_index + raw_group_id`
3. 複数 block 組で `raw_block_order` が信頼できない場合は hint を出さない
4. 同ページ組 → `intra_page`
5. 跨ページ組 → `cross_page`

## 下流消費

translation は provider-first:

1. 同ページ `intra_page` を優先消費
2. `cross_page` は安全条件を満たすときのみ制御付き消費
3. 不安全なら hint は保持するが拼接は起こさない

adapter は「provider が知っていること」を正確に表現。translation は「いつ信じるか」を決める。

## 注意

1. `group_id` は組内安定でよい。バージョン跨ぎ永久不変は不要
2. `reading_order` は組内で一意かつ単調
3. グループ情報が不安定な Paddle 版では寧可 hint 無し
4. サンプル合格のための偽 cross_page 連続を作らない
