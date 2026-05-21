# Paddle OCR 連携ドキュメント

本ドキュメント群の目的は 1 つです。

- Paddle OCR の生返却を、安定して `normalized_document_v1` に収束させる

翻訳ルール書やレンダ戦略はここに書かない。

## 連携境界

Paddle OCR 担当者が行うこと:

1. Paddle 生 API と JSON 構造の理解
2. provider 検出と adapter の実装
3. Paddle 私有フィールドから `document.v1` へのマッピング
4. fixture・回帰テスト・ドキュメントの整備

行わないこと:

1. `services/translation/*` の変更
2. `services/rendering/*` の変更
3. `runtime/pipeline/*` への Paddle 私有分岐
4. 下流が Paddle raw JSON を直接読む設計

## 現在のコード入口

- provider 登録: `backend/scripts/services/document_schema/adapters.py`
- provider 定数: `backend/scripts/services/document_schema/providers.py`
- Paddle adapter: `backend/scripts/services/document_schema/provider_adapters/paddle/adapter.py`
- page reader: `backend/scripts/services/document_schema/provider_adapters/paddle/page_reader.py`
- block reader: `backend/scripts/services/document_schema/provider_adapters/paddle/block_reader.py`
- 共通契約: `backend/scripts/services/document_schema/README.md`

## 読む順序

1. [00_overview.md](./00_overview.md)
2. [01_response_shape.md](./01_response_shape.md)
3. [02_field_mapping.md](./02_field_mapping.md)
4. [03_semantics_rules.md](./03_semantics_rules.md)
5. [04_continuation_hint.md](./04_continuation_hint.md)
6. [05_adapter_checklist.md](./05_adapter_checklist.md)

## 連携原則

1. Paddle 私有フィールドは adapter 層と trace 層に留める。
2. 下流メインチェーンは `document.v1.json` のみ消費。
3. Paddle が連続段落を識別している場合は `continuation_hint` に写し、`group_id` 等を translation に漏らさない。
4. まず schema を正しくし、意味論強化は後回し。
