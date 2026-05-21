# フロントエンド最適化メモ

本メモは現在の `frontend/` の技術的負債に焦点を当て、フロント担当が次を判断しやすくするためのものです。

- 何を先に直すか
- 何が後続開発を遅らせるか
- 何が体験層の最適化に留まるか

## 現在の構造概観

フロントは非常に軽量な素の JS + Tailwind で、フレームワークも bundler も runtime state 管理層もありません。

定量:

- コア入口: `frontend/src/js/main.js` 約 1291 行
- UI レンダ: `frontend/src/js/ui.js` 約 624 行
- タスク整形: `frontend/src/js/job.js` 約 424 行
- スタイル: `frontend/src/styles/components.css` 約 1747 行
- ソース総量 約 224K
- `frontend/node_modules` がリポジトリに含まれ 約 16M

結論: 「機能過多」ではなく「安定した分层が無い」ため、複雑度が少数の大ファイルに集中しています。

## P0: 先に対処すべき問題

### 1. 主入口が巨大で、業務・イベント・ポーリング・フォームが結合

ファイル: `frontend/src/js/main.js`

- token 検証、フォーム収集、タスク投入、ポーリング、最近タスク、開発者設定、資格情報ダイアログ、ページイベント束ねを一手に担当
- 小変更が他フローに波及しやすい

推奨分割（最低 4 モジュール）:

- `job-submit.js`
- `job-polling.js`
- `recent-jobs.js`
- `settings-dialog.js`

`main.js` は初期化・モジュール組み立て・トップレベルエラー処理のみ。

### 2. グローバル mutable state に更新境界がない

`state.js`, `main.js`, `ui.js` が裸 `state` を直接書き換え。mutation 境界と購読が無い。

軽量 store（`getState`, `patchState`, `subscribe`）で `jobState`, `uploadState`, `recentJobsState`, `developerState` を分離推奨。

### 3. 大量の `innerHTML` 拼接

`ui.js`, `templates.js`, `main.js` がリスト全体を `innerHTML` で差し替え。イベント喪失・局部更新不可・性能・一貫性の問題。

高頻度リスト（イベント流れ、stage history、最近タスク）は `createElement` / `replaceChildren` / `append` へ。

### 4. ハードコードされた開発者パスワード

`main.js` に `const DEVELOPER_PASSWORD = "Gk265157!";` — フロント公開は実質無防備。

高度設定はローカルスイッチ、`runtime-config`、デスクトップ設定ページへ。本当の認証はバックエンドまたはホスト層。

## P1: 保守効率に直結する問題

### 5. `job.js` の互換層が厚い

`normalizeJobPayload()` が多フィールド fallback、URL 補完、actions/artifacts 二重来源、legacy 融合を担当。バックエンド契約は安定しているのにフロントが「寛容互換」になっている。

目標: envelope unwrap と軽量整形のみ。インターフェース互換層として膨らませない。

### 6. ポーリングと詳細取得の深い結合

`fetchJob` が detail / events / artifacts-manifest を直列取得。3 秒固定ポーリング。状態に応じた適応なし。

`pollJobSnapshot`, `refreshEvents`, `refreshArtifactsManifest` に分割。終端状態で即停止。

### 7. 設定来源の分散

`config.js`, `desktop.js`, `main.js` に runtime / localStorage / desktop bridge が混在。`desktopMode` 判定が散在。

`appEnv`（`mode`, `capabilities`, `credentialSource`）を 1 層に集約。

### 8. 単一 CSS 巨大ファイル

`components.css` 約 1747 行。dialog / topbar / hero / developer / status / events が混在。

`layout.css`, `dialogs.css`, `job-status.css`, `developer-panel.css`, `recent-jobs.css` 等へ分割推奨。

## P2: 体験・工程規範

### 9. `node_modules` をリポジトリに含めない

約 16M。削除し `.gitignore` を確認。`package.json` と lock のみ残す。

### 10. lint / test が無い

`package.json` に `build:css`, `watch:css` のみ。ESLint, Prettier, `job.js` の最小単体テストを推奨。

## 推奨順序

**第一段階（低リスク）**: 開発者パスワード削除、`node_modules` 除去、高頻度リストの DOM 化、`main.js` 最低限分割。

**第二段階**: 軽量 store、設定来源の分離、`job.js` 互換層の縮小。

**第三段階**: CSS 分割、lint/format/最小テスト、フレームワーク要否の判断。

## 結論

現状は「性能が悪い」より「構造が緩い」。

先にやるべきは `main.js` 分割、裸 `state` の収束、`innerHTML` 高頻度域の DOM 化、疑似認証とホスト差分の整理。ここまでで React/Vue 移行のコストも下がります。
