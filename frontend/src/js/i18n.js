/**
 * バックエンド由来の中国語・英語 UI 文言を日本語表示に変換する。
 * API 契約上の識別子（job_id、workflow 名など）はそのまま残す。
 */

const STAGE_DETAIL_EXACT = {
  "OCR 任务已取消": "OCR タスクはキャンセルされました",
  "任务已取消": "タスクはキャンセルされました",
  "OCR 任务已创建，等待可用执行槽位": "OCR タスクを作成しました。実行スロットの空きを待機中",
  "翻译任务已创建，等待 OCR 子任务": "翻訳タスクを作成しました。OCR サブタスクを待機中",
  "渲染任务已创建，等待可用执行槽位": "レンダリングタスクを作成しました。実行スロットの空きを待機中",
  "任务已创建，等待可用执行槽位": "タスクを作成しました。実行スロットの空きを待機中",
  "正在运行": "実行中",
  "正在渲染": "レンダリング中",
  "正在翻译": "翻訳中",
  "正在启动 OCR 子任务": "OCR サブタスクを起動中",
  "OCR 子任务已创建": "OCR サブタスクを作成しました",
  "翻译完成，开始渲染": "翻訳完了。レンダリングを開始",
  "OCR 子任务已取消": "OCR サブタスクはキャンセルされました",
  "OCR 子任务失败": "OCR サブタスクが失敗しました",
  "正在执行块规则、分类和局部拆分": "ブロックルール・分類・局部分割を実行中",
  "文件上传完成，等待 MinerU 处理": "ファイルのアップロード完了。MinerU の処理を待機中",
  "MinerU 结果已就绪，准备生成标准化 OCR 文档": "MinerU の結果を取得済み。標準化 OCR ドキュメントを生成します",
  "正在识别论文领域": "論文分野を識別中",
  "正在判断跨栏/跨页连续段": "段組み跨ぎ・ページ跨ぎの連続ブロックを判定中",
  "正在准备渲染": "レンダリング準備中",
  "正在保存最终结果": "最終結果を保存中",
  "任务排队中，等待可用执行槽位": "タスクをキューに追加しました。実行スロットの空きを待機中",
  "正在生成标准化 OCR 文档": "標準化 OCR ドキュメントを生成中",
  "已获取 MinerU 上传地址，开始上传文件": "MinerU のアップロード URL を取得。ファイルをアップロード中",
  "文件上传完成，等待 MinerU 解析": "ファイルのアップロード完了。MinerU の解析を待機中",
  "远程 PDF 已提交到 MinerU，等待解析": "リモート PDF を MinerU に送信済み。解析を待機中",
  "正在基于已有翻译产物重新渲染": "既存の翻訳成果物から再レンダリング中",
  "Paddle 任务已提交，等待解析": "Paddle タスクを送信済み。解析を待機中",
  "MinerU 结果已就绪，正在下载原始 bundle": "MinerU の結果を取得済み。元の bundle をダウンロード中",
  "正在启动 Python worker": "Python worker を起動中",
  "任务完成": "タスク完了",
  "任务完成（已忽略 Python 退出阶段的收尾噪音）": "タスク完了（Python 終了時のノイズは無視）",
  "Python worker 执行失败": "Python worker の実行に失敗しました",
  "OCR 已完成，但任务源 PDF 缺失": "OCR は完了しましたが、タスク元 PDF がありません",
  "排队": "待機中",
  "等待": "待機中",
};

const STAGE_DETAIL_PATTERNS = [
  [/^正在翻译，第 (\d+)\/(\d+) 批$/, "翻訳中（$1/$2 バッチ）"],
  [/^已完成第 (\d+)\/(\d+) 批翻译$/, "バッチ $1/$2 の翻訳が完了"],
  [/^正在渲染第 (\d+)\/(\d+) 页$/, "レンダリング中（$1/$2 ページ）"],
];

const FAILURE_SUMMARY_EXACT = {
  "任务失败，但暂未识别出明确根因": "タスクは失敗しましたが、明確な根本原因は特定できませんでした",
  "外部服务域名解析失败": "外部サービスのドメイン名解決に失敗しました",
  "外部服务请求超时": "外部サービスへのリクエストがタイムアウトしました",
  "鉴权失败": "認証に失敗しました",
  "上游服务拒绝请求（400）": "上流サービスがリクエストを拒否しました（400）",
  "公式占位符校验失败": "数式プレースホルダの検証に失敗しました",
  "Typst 渲染依赖下载失败": "Typst レンダリング依存のダウンロードに失敗しました",
  "排版或编译阶段失败": "組版またはコンパイル段階で失敗しました",
  "OCR 结果 JSON 解析失败": "OCR 結果 JSON の解析に失敗しました",
  "标准化文档校验失败": "標準化ドキュメントの検証に失敗しました",
  "源 PDF 缺失": "元 PDF がありません",
  "源 PDF 打开失败": "元 PDF を開けませんでした",
};

const LABEL_EXACT = {
  "Stage Spec": "Stage Spec",
  "Unknown": "不明",
  "Legacy CLI": "レガシー CLI",
  "Job ID": "タスク ID",
  "Stage Schema": "段階スキーマ",
  "unknown error": "不明なエラー",
};

/**
 * ユーザー向け表示テキストを日本語に正規化する。
 *
 * @param {string} text
 * @returns {string}
 */
export function localizeUserFacingText(text) {
  const raw = `${text ?? ""}`.trim();
  if (!raw) {
    return raw;
  }

  if (STAGE_DETAIL_EXACT[raw]) {
    return STAGE_DETAIL_EXACT[raw];
  }
  if (FAILURE_SUMMARY_EXACT[raw]) {
    return FAILURE_SUMMARY_EXACT[raw];
  }
  if (LABEL_EXACT[raw]) {
    return LABEL_EXACT[raw];
  }

  for (const [pattern, replacement] of STAGE_DETAIL_PATTERNS) {
    const match = raw.match(pattern);
    if (match) {
      return replacement.replace(/\$(\d+)/g, (_, index) => match[Number(index)] || "");
    }
  }

  return raw;
}

/**
 * @param {string} protocol
 * @returns {string}
 */
export function localizeInputProtocol(protocol) {
  const value = `${protocol || ""}`.trim();
  if (value === "stage_spec") {
    return "Stage Spec";
  }
  if (!value) {
    return "-";
  }
  return localizeUserFacingText(value);
}

/**
 * @param {{ stageSpecCount?: number, unknownCount?: number }} counts
 * @returns {string}
 */
export function formatInvocationSummary(counts) {
  const stageSpec = Number(counts?.stageSpecCount) || 0;
  const unknown = Number(counts?.unknownCount) || 0;
  return `Stage Spec ${stageSpec} · 不明 ${unknown}`;
}
