# Rust API 説明

本ドキュメント群は、フロントエンド連携・バックエンド保守・問題排查向けです。

「どのフィールドを読むべきか」を素早く把握する場合は、次の順で読んでください。

1. [01-レスポンス包装.md](./01-レスポンス包装.md)
2. [02-タスク詳細とタイムライン.md](./02-タスク詳細とタイムライン.md)
3. [03-イベントストリーム.md](./03-イベントストリーム.md)
4. [04-タスクライフサイクル.md](./04-タスクライフサイクル.md)
5. [05-連携とトラブルシュート.md](./05-連携とトラブルシュート.md)
6. [06-成果物一覧とダウンロード.md](./06-成果物一覧とダウンロード.md)
7. [07-タスクリスト API.md](./07-タスクリストAPI.md)
8. [08-Provider 検証 API.md](./08-Provider検証API.md)
9. [09-共同開発の約束.md](./09-共同開発の約束.md)

現在の重要な結論:

- 成功レスポンスはすべて `code/message/data` の 3 層包装
- タスク詳細ページの主 API は `GET /api/v1/jobs/{job_id}`
- 「過程タイムライン」は必ず `runtime.stage_history` を読む
- 「イベントストリーム」タブは `GET /api/v1/jobs/{job_id}/events` を読む
- ファイルダウンロードと成果物探索は `GET /api/v1/jobs/{job_id}/artifacts-manifest` を優先
- 翻訳パラメータの `translation.math_mode` は利用可能。デフォルト `placeholder`、実験値 `direct_typst`
- 新タスクの Python worker は `--spec` 駆動に統一。詳細/リストの `invocation` に `input_protocol=stage_spec` が表示される
- `normalization_summary` は `document.v1.report.json` の簡易ビュー。デフォルト値の収束フィールドは `document_defaults` / `page_defaults` / `block_defaults` に統一
- イベントストリーム API の `items` は `data.items` にあり、トップレベルではない
- 履歴の古いタスクでは `runtime = null` があり得る。これは履歴データ欠損であり、現在の API 障害ではない
- `originPDF/jsonPDF/transPDF/typstPDF` 旧ディレクトリレイアウト、または DB に絶対パス artifact が残る旧タスクは、詳細・ダウンロード API が直接拒否する。再実行が必要

現在のコード境界上の約束:

- `routes/*` は HTTP adapter のみ。view 集約や job command の直接組み立てはしない
- `services/jobs/creation` と `services/job_factory` は「純粋な組み立て」と「実行開始」に分離。純粋組み立ては `Db`、`AppConfig`、明示パラメータのみに依存し、`AppState` 全体を透過させない
- 複数人開発時は [09-共同開発の約束.md](./09-共同開発の約束.md) の配置・依存ルールに従う

`AppState` が存在してよい主な場所:

- ルート入口
- job lifecycle / process runner など、実行時リソース協調が必要な層

`AppState` を下に渡さないことが望ましい場所:

- コマンド構築
- job snapshot 組み立て
- 読み取り専用 view 集約
- アップロード検証と純入力組み立て
