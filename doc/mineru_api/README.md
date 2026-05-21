MinerU は 2 種類のドキュメント解析 API を提供し、異なるシナリオの要件に対応します：

🎯 精密解析 API — Token の申請が必要。単一ファイル／バッチ、表／数式／複数フォーマット出力に対応
⚡ Agent 軽量解析 API — ログイン不要、IP レート制限で悪用を防止、AI Agent ワークフロー向けに設計
モード比較
比較項目	🎯 精密解析 API	⚡ Agent 軽量解析 API
Token の要否	✅ 必要	❌ 不要（IP レート制限）
エンドポイント	/api/v4/extract/task または /api/v4/file-urls/batch	/api/v1/agent/parse/url または /api/v1/agent/parse/file
モデルバージョン	pipeline（デフォルト）/ vlm（推奨）/ MinerU-HTML	固定 pipeline 軽量モデル
ファイルサイズ上限	≤ 200MB	≤ 10MB
ページ数上限	≤ 600 ページ	≤ 20 ページ
バッチ対応	✅ 対応（≤ 200 件）	❌ 単一ファイルのみ
出力形式	Zip パッケージ（Markdown、JSON を含み、docx/html/latex へエクスポート可能）	Markdown のみ（CDN リンク）
呼び出し方式	非同期（送信 → ポーリング）	非同期（送信 → ポーリング）
🎯 精密解析 API
Token の申請が必要。pipeline / vlm / MinerU-HTML の 3 モデルに対応し、単一ファイルとバッチの両方をサポートします。

概要
MinerU の精密解析 API は、高精度かつ深い構造化抽出を必要とする複雑なドキュメント向けに設計されています。各種の複雑なレイアウトやマルチモーダルコンテンツ（表、数式、図表、画像、多段組レイアウトなど）をインテリジェントに認識・処理し、ドキュメント内容を高品質な構造化データへ変換します。

コア機能：

極限精度：業界トップクラスの解析精度を提供。非標準・複雑なドキュメントの処理に特に強い
深い構造化：単なるテキスト抽出にとどまらず、レイアウトと意味を深く理解し、豊富な階層関係を含む構造化データを出力
マルチモーダル対応：テキスト、表、画像、数式など多様なコンテンツタイプの精密な認識・抽出に全面対応
複雑レイアウト適応：スキャン文書、乱れた組版、透かしの干渉など複雑なドキュメントシナリオに効果的に対応
ファイル制限：

制限項目	制限値
ファイルサイズ上限	200 MB
ファイルページ数上限	600 ページ
対応ファイルタイプ	PDF、画像（png/jpg/jpeg/jp2/webp/gif/bmp）、Doc、Docx、Ppt、PPTx
単一ファイル解析
解析タスクの作成
エンドポイント説明

API 経由で解析タスクを作成するシナリオ向け。ユーザーは事前に Token を申請する必要があります。 注意：

単一ファイルのサイズは 200MB を超えられず、ページ数は 600 ページ以内
各アカウントは 1 日あたり 2000 ページ分の最高優先度解析クォータを享有。2000 ページを超えた分は優先度が低下
ネットワーク制限により、github、aws など海外 URL はリクエストがタイムアウトする場合があります
本 APIはファイルの直接アップロードに非対応
header には Authorization フィールドが必要。形式は Bearer + 半角スペース + Token
Python リクエスト例（pdf、doc、ppt、画像ファイル向け）：

import requests

token = "公式サイトで申請した api token"
url = "https://mineru.net/api/v4/extract/task"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "model_version": "vlm"
}

res = requests.post(url,headers=header,json=data)
print(res.status_code)
print(res.json())
print(res.json()["data"])
Python リクエスト例（html ファイル向け）：

import requests

token = "公式サイトで申請した api token"
url = "https://mineru.net/api/v4/extract/task"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "url": "https://****",
    "model_version": "MinerU-HTML"
}

res = requests.post(url,headers=header,json=data)
print(res.status_code)
print(res.json())
print(res.json()["data"])
CURL リクエスト例（pdf、doc、ppt、画像ファイル向け）：

curl --location --request POST 'https://mineru.net/api/v4/extract/task' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
    "model_version": "vlm"
}'
CURL リクエスト例（html ファイル向け）：

curl --location --request POST 'https://mineru.net/api/v4/extract/task' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "url": "https://****",
    "model_version": "MinerU-HTML"
}'
リクエストボディパラメータ説明

パラメータ	型	必須	例	説明
url	string	必須	https://static.openxlab.org.cn/
opendatalab/pdf/demo.pdf	ファイル URL。.pdf、.doc、.docx、.ppt、.pptx、画像（png/jpg/jpeg/jp2/webp/gif/bmp）、.html など複数形式に対応
is_ocr	bool	任意	false	OCR 機能を有効にするか。デフォルト false。pipeline、vlm モデルのみ有効
enable_formula	bool	任意	true	数式認識を有効にするか。デフォルト true。pipeline、vlm モデルのみ有効。特に注意：vlm モデルでは、本パラメータはインライン数式の解析にのみ影響
enable_table	bool	任意	true	表認識を有効にするか。デフォルト true。pipeline、vlm モデルのみ有効
language	string	任意	ch	ドキュメント言語の指定。デフォルト ch。選択可能な値は language パラメータ値一覧 を参照。pipeline、vlm モデルのみ有効
data_id	string	任意	abc**	解析対象に対応するデータ ID。英大文字・小文字、数字、アンダースコア（_）、ハイフン（-）、ピリオド（.）で構成され、128 文字以内。業務データの一意識別に使用可能
callback	string	任意	http://127.0.0.1/callback	解析結果を通知する callback URL。HTTP および HTTPS に対応。本フィールドが空の場合、解析結果を定期的にポーリングする必要があります。callback エンドポイントは POST メソッド、UTF-8 エンコーディング、Content-Type:application/json によるデータ転送、および checksum と content パラメータに対応する必要があります。解析 APIは以下のルールと形式で checksum と content を設定し、callback エンドポイントを呼び出して検出結果を返します。
checksum：文字列形式。ユーザー uid + seed + content を連結した文字列を SHA256 アルゴリズムで生成。ユーザー UID は個人センターで確認可能。改ざん防止のため、プッシュ結果を受信した際に上記アルゴリズムで文字列を生成し、checksum と照合することを推奨
content：JSON 文字列形式。パースして JSON オブジェクトに変換してください。content 結果の例は、タスク照会結果の返却例を参照（タスク照会結果の data 部分に対応）
説明：サーバー側 callback エンドポイントが Mineru 解析サービスからプッシュされた結果を受信し、HTTP ステータスコード 200 を返した場合、受信成功とみなされます。200 以外は受信失敗です。受信失敗時、mineru は最大 5 回まで検出結果を再プッシュします。5 回再プッシュ後も受信成功しない場合、プッシュは停止されます。callback エンドポイントの状態を確認してください
seed	string	任意	abc**	ランダム文字列。callback 通知リクエストの署名に使用。英字、数字、アンダースコア（_）で構成され、64 文字以内。カスタム定義。callback 通知受信時に Mineru 解析サービスからのリクエストであることを検証するために使用
説明：callback を使用する場合、本フィールドは必須
extra_formats	[string]	任意	["docx","html"]	markdown、json はデフォルトのエクスポート形式のため設定不要。本パラメータは docx、html、latex のいずれかまたは複数のみサポート。ソースファイルが html の場合は無効
page_ranges	string	任意	1-600	ページ範囲の指定。カンマ区切り文字列形式。例："2,4-6"：2 ページ目、4 ページ目から 6 ページ目まで（4 と 6 を含む、結果は [2,4,5,6]）；"2--2"：2 ページ目から末尾から 2 ページ目まで（"-2" は末尾から 2 ページ目を意味）
model_version	string	任意	vlm	mineru モデルバージョン。3 つの選択肢：pipeline、vlm、MinerU-HTML。デフォルト pipeline。HTML ファイルを解析する場合、model_version は MinerU-HTML を明示指定。非 HTML ファイルの場合、pipeline または vlm を選択可能
no_cache	bool	任意	false	キャッシュをバイパスするか。デフォルト false。API サーバーは URL コンテンツを一定期間キャッシュします。true に設定するとキャッシュ結果を無視し、URL から最新コンテンツを取得
cache_tolerance	int	任意	900	キャッシュ許容時間（秒）。デフォルト 900（15 分）。許容される URL コンテンツキャッシュの有効時間。この時間を超えたキャッシュは使用されません。no_cache が false の場合に有効
レスポンスパラメータ説明

パラメータ	型	例	説明
code	int	0	API ステータスコード。成功：0
msg	string	ok	API 処理メッセージ。成功："ok"
trace_id	string	c876cd60b202f2396de1f9e39a1b0172	リクエスト ID
data.task_id	string	a90e6ab6-44f3-4554-b459-b62fe4c6b436	抽出タスク id。タスク結果の照会に使用
レスポンス例

{
  "code": 0,
  "data": {
    "task_id": "a90e6ab6-44f3-4554-b4***"
  },
  "msg": "ok",
  "trace_id": "c876cd60b202f2396de1f9e39a1b0172"
}
タスク結果の取得
エンドポイント説明

task_id により抽出タスクの現在の進捗を照会します。タスク処理完了後、API は対応する抽出詳細を返します。

Python リクエスト例

import requests

token = "公式サイトで申請した api token"
task_id = "前ステップでタスク作成時に返却された task_id"
url = f"https://mineru.net/api/v4/extract/task/{task_id}"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

res = requests.get(url, headers=header)
print(res.status_code)
print(res.json())
print(res.json()["data"])
CURL リクエスト例

curl --location --request GET 'https://mineru.net/api/v4/extract/task/{task_id}' \
--header 'Authorization: Bearer *****' \
--header 'Accept: */*'
レスポンスパラメータ説明

パラメータ	型	例	説明
code	int	0	API ステータスコード。成功：0
msg	string	ok	API 処理メッセージ。成功："ok"
trace_id	string	c876cd60b202f2396de1f9e39a1b0172	リクエスト ID
data.task_id	string	abc**	タスク ID
data.data_id	string	abc**	解析対象に対応するデータ ID。
説明：解析リクエストパラメータで data_id を渡した場合、ここに対応する data_id が返されます
data.state	string	done	タスク処理状態。完了：done、pending：キュー待ち、running：解析中、failed：解析失敗、converting：フォーマット変換中
data.full_zip_url	string	https://cdn-mineru.openxlab.org.cn/
pdf/018e53ad-d4f1-475d-b380-36bf24db9914.zip	ファイル解析結果の圧縮パッケージ
非 html ファイルの解析結果の詳細は https://opendatalab.github.io/MinerU/reference/output_files/ を参照。layout.json は中間処理結果（middle.json）、**_model.json はモデル推論結果（model.json）、**_content_list.json はコンテンツリスト（content_list.json）、full.md は MarkDown 解析結果に対応

html ファイルの解析結果は若干異なります：full.md は MarkDown 解析結果、main.html は抽出後の本文 html
data.err_msg	string	ファイル形式がサポート対象外です。要件を満たすファイルタイプをアップロードしてください	解析失敗理由。state=failed の場合に有効
data.extract_progress.extracted_pages	int	1	解析済みページ数。state=running の場合に有効
data.extract_progress.start_time	string	2025-01-20 11:43:20	ドキュメント解析開始時刻。state=running の場合に有効
data.extract_progress.total_pages	int	2	ドキュメント総ページ数。state=running の場合に有効
レスポンス例

{
  "code": 0,
  "data": {
    "task_id": "47726b6e-46ca-4bb9-******",
    "state": "running",
    "err_msg": "",
    "extract_progress": {
      "extracted_pages": 1,
      "total_pages": 2,
      "start_time": "2025-01-20 11:43:20"
    }
  },
  "msg": "ok",
  "trace_id": "c876cd60b202f2396de1f9e39a1b0172"
}
{
  "code": 0,
  "data": {
    "task_id": "47726b6e-46ca-4bb9-******",
    "state": "done",
    "full_zip_url": "https://cdn-mineru.openxlab.org.cn/pdf/018e53ad-d4f1-475d-b380-36bf24db9914.zip",
    "err_msg": ""
  },
  "msg": "ok",
  "trace_id": "c876cd60b202f2396de1f9e39a1b0172"
}
バッチファイル解析
ローカルファイルのバッチアップロード解析
エンドポイント説明

ローカルファイルをアップロードして解析するシナリオ向け。本 APIでバッチのファイルアップロード URL を申請できます。ファイルアップロード後、システムが自動的に解析タスクを送信します 注意：

申請したファイルアップロード URL の有効期限は 24 時間。有効期限内にアップロードを完了してください
ファイルアップロード時、Content-Type リクエストヘッダーの設定は不要
ファイルアップロード完了後、解析タスク送信 API の呼び出しは不要。システムがアップロード完了ファイルを自動スキャンし、解析タスクを自動送信
1 回の申請で URL は 200 件を超えられません
header には Authorization フィールドが必要。形式は Bearer + 半角スペース + Token
Python リクエスト例（pdf、doc、ppt、画像ファイル向け）：

import requests

token = "公式サイトで申請した api token"
url = "https://mineru.net/api/v4/file-urls/batch"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "files": [
        {"name":"demo.pdf", "data_id": "abcd"}
    ],
    "model_version":"vlm"
}
file_path = ["demo.pdf"]
try:
    response = requests.post(url,headers=header,json=data)
    if response.status_code == 200:
        result = response.json()
        print('response success. result:{}'.format(result))
        if result["code"] == 0:
            batch_id = result["data"]["batch_id"]
            urls = result["data"]["file_urls"]
            print('batch_id:{},urls:{}'.format(batch_id, urls))
            for i in range(0, len(urls)):
                with open(file_path[i], 'rb') as f:
                    res_upload = requests.put(urls[i], data=f)
                    if res_upload.status_code == 200:
                        print(f"{urls[i]} upload success")
                    else:
                        print(f"{urls[i]} upload failed")
        else:
            print('apply upload url failed,reason:{}'.format(result["msg"]))
    else:
        print('response not success. status:{} ,result:{}'.format(response.status_code, response))
except Exception as err:
    print(err)
Python リクエスト例（html ファイル向け）：

import requests

token = "公式サイトで申請した api token"
url = "https://mineru.net/api/v4/file-urls/batch"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "files": [
        {"name":"demo.html", "data_id": "abcd"}
    ],
    "model_version":"MinerU-HTML"
}
file_path = ["demo.html"]
try:
    response = requests.post(url,headers=header,json=data)
    if response.status_code == 200:
        result = response.json()
        print('response success. result:{}'.format(result))
        if result["code"] == 0:
            batch_id = result["data"]["batch_id"]
            urls = result["data"]["file_urls"]
            print('batch_id:{},urls:{}'.format(batch_id, urls))
            for i in range(0, len(urls)):
                with open(file_path[i], 'rb') as f:
                    res_upload = requests.put(urls[i], data=f)
                    if res_upload.status_code == 200:
                        print(f"{urls[i]} upload success")
                    else:
                        print(f"{urls[i]} upload failed")
        else:
            print('apply upload url failed,reason:{}'.format(result["msg"]))
    else:
        print('response not success. status:{} ,result:{}'.format(response.status_code, response))
except Exception as err:
    print(err)
CURL リクエスト例（pdf、doc、ppt、画像ファイル向け）：

curl --location --request POST 'https://mineru.net/api/v4/file-urls/batch' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "files": [
        {"name":"demo.pdf", "data_id": "abcd"}
    ],
    "model_version": "vlm"
}'
CURL リクエスト例（html ファイル向け）：

curl --location --request POST 'https://mineru.net/api/v4/file-urls/batch' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "files": [
        {"name":"demo.html", "data_id": "abcd"}
    ],
    "model_version": "MinerU-HTML"
}'
CURL ファイルアップロード例：

curl -X PUT -T /path/to/your/file.pdf 'https://****'
リクエストボディパラメータ説明

パラメータ	型	必須	例	説明
enable_formula	bool	任意	true	数式認識を有効にするか。デフォルト true。pipeline、vlm モデルのみ有効。特に注意：vlm モデルでは、本パラメータはインライン数式の解析にのみ影響
enable_table	bool	任意	true	表認識を有効にするか。デフォルト true。pipeline、vlm モデルのみ有効
language	string	任意	ch	ドキュメント言語の指定。デフォルト ch。選択可能な値は language パラメータ値一覧 を参照。pipeline、vlm モデルのみ有効
file.‌name	string	必須	demo.pdf	ファイル名。.pdf、.doc、.docx、.ppt、.pptx、画像（png/jpg/jpeg/jp2/webp/gif/bmp）、.html など複数形式に対応。正しい拡張子付きのファイル名を強く推奨
file.is_ocr	bool	任意	true	OCR 機能を有効にするか。デフォルト false。pipeline、vlm モデルのみ有効
file.data_id	string	任意	abc**	解析対象に対応するデータ ID。英大文字・小文字、数字、アンダースコア（_）、ハイフン（-）、ピリオド（.）で構成され、128 文字以内。業務データの一意識別に使用可能
file.page_ranges	string	任意	1-600	ページ範囲の指定。カンマ区切り文字列形式。例："2,4-6"：2 ページ目、4 ページ目から 6 ページ目まで（4 と 6 を含む、結果は [2,4,5,6]）；"2--2"：2 ページ目から末尾から 2 ページ目まで（"-2" は末尾から 2 ページ目を意味）
callback	string	任意	http://127.0.0.1/callback	解析結果を通知する callback URL。HTTP および HTTPS に対応。本フィールドが空の場合、解析結果を定期的にポーリングする必要があります。callback エンドポイントは POST メソッド、UTF-8 エンコーディング、Content-Type:application/json によるデータ転送、および checksum と content パラメータに対応する必要があります。解析 APIは以下のルールと形式で checksum と content を設定し、callback エンドポイントを呼び出して検出結果を返します。
checksum：文字列形式。ユーザー uid + seed + content を連結した文字列を SHA256 アルゴリズムで生成。ユーザー UID は個人センターで確認可能。改ざん防止のため、プッシュ結果を受信した際に上記アルゴリズムで文字列を生成し、checksum と照合することを推奨
content：JSON 文字列形式。パースして JSON オブジェクトに変換してください。content 結果の例は、タスク照会結果の返却例を参照（タスク照会結果の data 部分に対応）
説明：サーバー側 callback エンドポイントが Mineru 解析サービスからプッシュされた結果を受信し、HTTP ステータスコード 200 を返した場合、受信成功とみなされます。200 以外は受信失敗です。受信失敗時、mineru は最大 5 回まで検出結果を再プッシュします。5 回再プッシュ後も受信成功しない場合、プッシュは停止されます。callback エンドポイントの状態を確認してください
seed	string	任意	abc**	ランダム文字列。callback 通知リクエストの署名に使用。英字、数字、アンダースコア（_）で構成され、64 文字以内。カスタム定義。callback 通知受信時に Mineru 解析サービスからのリクエストであることを検証するために使用
説明：callback を使用する場合、本フィールドは必須
extra_formats	[string]	任意	["docx","html"]	markdown、json はデフォルトのエクスポート形式のため設定不要。本パラメータは docx、html、latex のいずれかまたは複数のみサポート。ソースファイルが html の場合は無効
model_version	string	任意	vlm	mineru モデルバージョン。3 つの選択肢：pipeline、vlm、MinerU-HTML。デフォルト pipeline。HTML ファイルを解析する場合、model_version は MinerU-HTML を明示指定。非 HTML ファイルの場合、pipeline または vlm を選択可能
レスポンスパラメータ説明

パラメータ	型	例	説明
code	int	0	API ステータスコード。成功： 0
msg	string	ok	API 処理メッセージ。成功："ok"
trace_id	string	c876cd60b202f2396de1f9e39a1b0172	リクエスト ID
data.batch_id	string	2bb2f0ec-a336-4a0a-b61a-****	バッチ抽出タスク id。バッチ解析結果の照会に使用
data.file_urls	[string]	["https://mineru.oss-cn-shanghai.aliyuncs.com/api-upload/***"]	ファイルアップロード URL
レスポンス例

{
  "code": 0,
  "data": {
    "batch_id": "2bb2f0ec-a336-4a0a-b61a-241afaf9cc87",
    "file_urls": ["https://***"]
  },
  "msg": "ok",
  "trace_id": "c876cd60b202f2396de1f9e39a1b0172"
}
URL バッチアップロード解析
エンドポイント説明

API 経由でバッチ抽出タスクを作成するシナリオ向け 注意：

1 回の申請で URL は 200 件を超えられません
ファイルサイズは 200MB を超えられず、ページ数は 600 ページ以内
ネットワーク制限により、github、aws など海外 URL はリクエストがタイムアウトする場合があります
header には Authorization フィールドが必要。形式は Bearer + 半角スペース + Token
Python リクエスト例（pdf、doc、ppt、画像ファイル向け）：

import requests

token = "公式サイトで申請した api token"
url = "https://mineru.net/api/v4/extract/task/batch"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "files": [
        {"url":"https://cdn-mineru.openxlab.org.cn/demo/example.pdf", "data_id": "abcd"}
    ],
    "model_version": "vlm"
}
try:
    response = requests.post(url,headers=header,json=data)
    if response.status_code == 200:
        result = response.json()
        print('response success. result:{}'.format(result))
        if result["code"] == 0:
            batch_id = result["data"]["batch_id"]
            print('batch_id:{}'.format(batch_id))
        else:
            print('submit task failed,reason:{}'.format(result["msg"]))
    else:
        print('response not success. status:{} ,result:{}'.format(response.status_code, response))
except Exception as err:
    print(err)
Python リクエスト例（html ファイル向け）：

import requests

token = "公式サイトで申請した api token"
url = "https://mineru.net/api/v4/extract/task/batch"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}
data = {
    "files": [
        {"url":"https://***", "data_id": "abcd"}
    ],
    "model_version": "MinerU-HTML"
}
try:
    response = requests.post(url,headers=header,json=data)
    if response.status_code == 200:
        result = response.json()
        print('response success. result:{}'.format(result))
        if result["code"] == 0:
            batch_id = result["data"]["batch_id"]
            print('batch_id:{}'.format(batch_id))
        else:
            print('submit task failed,reason:{}'.format(result["msg"]))
    else:
        print('response not success. status:{} ,result:{}'.format(response.status_code, response))
except Exception as err:
    print(err)
CURL リクエスト例（pdf、doc、ppt、画像ファイル向け）：

curl --location --request POST 'https://mineru.net/api/v4/extract/task/batch' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "files": [
        {"url":"https://cdn-mineru.openxlab.org.cn/demo/example.pdf", "data_id": "abcd"}
    ],
    "model_version": "vlm"
}'
CURL リクエスト例（html ファイル向け）：

curl --location --request POST 'https://mineru.net/api/v4/extract/task/batch' \
--header 'Authorization: Bearer ***' \
--header 'Content-Type: application/json' \
--header 'Accept: */*' \
--data-raw '{
    "files": [
        {"url":"https://***", "data_id": "abcd"}
    ],
    "model_version": "MinerU-HTML"
}'
リクエストボディパラメータ説明

パラメータ	型	必須	例	説明
enable_formula	bool	任意	true	数式認識を有効にするか。デフォルト true。pipeline、vlm モデルのみ有効。特に注意：vlm モデルでは、本パラメータはインライン数式の解析にのみ影響
enable_table	bool	任意	true	表認識を有効にするか。デフォルト true。pipeline、vlm モデルのみ有効
language	string	任意	ch	ドキュメント言語の指定。デフォルト ch。選択可能な値は language パラメータ値一覧 を参照。pipeline、vlm モデルのみ有効
file.url	string	必須	demo.pdf	ファイルリンク。.pdf、.doc、.docx、.ppt、.pptx、画像（png/jpg/jpeg/jp2/webp/gif/bmp）、.html など複数形式に対応
file.is_ocr	bool	任意	true	OCR 機能を有効にするか。デフォルト false。pipeline、vlm モデルのみ有効
file.data_id	string	任意	abc**	解析対象に対応するデータ ID。英大文字・小文字、数字、アンダースコア（_）、ハイフン（-）、ピリオド（.）で構成され、128 文字以内。業務データの一意識別に使用可能
file.page_ranges	string	任意	1-600	ページ範囲の指定。カンマ区切り文字列形式。例："2,4-6"：2 ページ目、4 ページ目から 6 ページ目まで（4 と 6 を含む、結果は [2,4,5,6]）；"2--2"：2 ページ目から末尾から 2 ページ目まで（"-2" は末尾から 2 ページ目を意味）
callback	string	任意	http://127.0.0.1/callback	解析結果を通知する callback URL。HTTP および HTTPS に対応。本フィールドが空の場合、解析結果を定期的にポーリングする必要があります。callback エンドポイントは POST メソッド、UTF-8 エンコーディング、Content-Type:application/json によるデータ転送、および checksum と content パラメータに対応する必要があります。解析 APIは以下のルールと形式で checksum と content を設定し、callback エンドポイントを呼び出して検出結果を返します。
checksum：文字列形式。ユーザー uid + seed + content を連結した文字列を SHA256 アルゴリズムで生成。ユーザー UID は個人センターで確認可能。改ざん防止のため、プッシュ結果を受信した際に上記アルゴリズムで文字列を生成し、checksum と照合することを推奨
content：JSON 文字列形式。パースして JSON オブジェクトに変換してください。content 結果の例は、タスク照会結果の返却例を参照（タスク照会結果の data 部分に対応）
説明：サーバー側 callback エンドポイントが Mineru 解析サービスからプッシュされた結果を受信し、HTTP ステータスコード 200 を返した場合、受信成功とみなされます。200 以外は受信失敗です。受信失敗時、mineru は最大 5 回まで検出結果を再プッシュします。5 回再プッシュ後も受信成功しない場合、プッシュは停止されます。callback エンドポイントの状態を確認してください
seed	string	任意	abc**	ランダム文字列。callback 通知リクエストの署名に使用。英字、数字、アンダースコア（_）で構成され、64 文字以内。カスタム定義。callback 通知受信時に Mineru 解析サービスからのリクエストであることを検証するために使用
説明：callback を使用する場合、本フィールドは必須
extra_formats	[string]	任意	["docx","html"]	markdown、json はデフォルトのエクスポート形式のため設定不要。本パラメータは docx、html、latex のいずれかまたは複数のみサポート。ソースファイルが html の場合は無効
model_version	string	任意	vlm	mineru モデルバージョン。3 つの選択肢：pipeline、vlm、MinerU-HTML。デフォルト pipeline。HTML ファイルを解析する場合、model_version は MinerU-HTML を明示指定。非 HTML ファイルの場合、pipeline または vlm を選択可能
no_cache	bool	任意	false	キャッシュをバイパスするか。デフォルト false。API サーバーは URL コンテンツを一定期間キャッシュします。true に設定するとキャッシュ結果を無視し、URL から最新コンテンツを取得
cache_tolerance	int	任意	900	キャッシュ許容時間（秒）。デフォルト 900（15 分）。許容される URL コンテンツキャッシュの有効時間。この時間を超えたキャッシュは使用されません。no_cache が false の場合に有効
リクエストボディ例

{
  "files": [
    {
      "url": "https://cdn-mineru.openxlab.org.cn/demo/example.pdf",
      "data_id": "abcd"
    }
  ],
  "model_version": "vlm"
}
レスポンスパラメータ説明

パラメータ	型	例	説明
code	int	0	API ステータスコード。成功：0
msg	string	ok	API 処理メッセージ。成功："ok"
trace_id	string	c876cd60b202f2396de1f9e39a1b0172	リクエスト ID
data.batch_id	string	2bb2f0ec-a336-4a0a-b61a-****	バッチ抽出タスク id。バッチ解析結果の照会に使用
レスポンス例

{
  "code": 0,
  "data": {
    "batch_id": "2bb2f0ec-a336-4a0a-b61a-241afaf9cc87"
  },
  "msg": "ok",
  "trace_id": "c876cd60b202f2396de1f9e39a1b0172"
}
バッチタスク結果の取得
エンドポイント説明

batch_id により抽出タスクの進捗をバッチ照会します。

Python リクエスト例

import requests

token = "公式サイトで申請した api token"
batch_id = "前ステップのバッチ送信で返却された batch_id"
url = f"https://mineru.net/api/v4/extract-results/batch/{batch_id}"
header = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

res = requests.get(url, headers=header)
print(res.status_code)
print(res.json())
print(res.json()["data"])
CURL リクエスト例

curl --location --request GET 'https://mineru.net/api/v4/extract-results/batch/{batch_id}' \
--header 'Authorization: Bearer *****' \
--header 'Accept: */*'
レスポンスパラメータ説明

パラメータ	型	例	説明
code	int	0	API ステータスコード。成功：0
msg	string	ok	API 処理メッセージ。成功："ok"
trace_id	string	c876cd60b202f2396de1f9e39a1b0172	リクエスト ID
data.batch_id	string	2bb2f0ec-a336-4a0a-b61a-241afaf9cc87	batch_id
data.extract_result.file_name	string	demo.pdf	ファイル名
data.extract_result.state	string	done	タスク処理状態。完了：done、waiting-file：ファイルアップロード待ち・キュー投入中、pending：キュー待ち、running：解析中、failed：解析失敗、converting：フォーマット変換中
data.extract_result.full_zip_url	string	https://cdn-mineru.openxlab.org.cn/pdf/018e53ad-d4f1-475d-b380-36bf24db9914.zip	ファイル解析結果の圧縮パッケージ
非 html ファイルの解析結果の詳細は https://opendatalab.github.io/MinerU/reference/output_files/ を参照。layout.json は中間処理結果（middle.json）、**_model.json はモデル推論結果（model.json）、**_content_list.json はコンテンツリスト（content_list.json）、full.md は MarkDown 解析結果に対応

html ファイルの解析結果は若干異なります：full.md は MarkDown 解析結果、main.html は抽出後の本文 html
data.extract_result.err_msg	string	ファイル形式がサポート対象外です。要件を満たすファイルタイプをアップロードしてください	解析失敗理由。state=failed の場合に有効
data.extract_result.data_id	string	abc**	解析対象に対応するデータ ID。
説明：解析リクエストパラメータで data_id を渡した場合、ここに対応する data_id が返されます
data.extract_result.extract_progress.extracted_pages	int	1	解析済みページ数。state=running の場合に有効
data.extract_result.extract_progress.start_time	string	2025-01-20 11:43:20	ドキュメント解析開始時刻。state=running の場合に有効
data.extract_result.extract_progress.total_pages	int	2	ドキュメント総ページ数。state=running の場合に有効
レスポンス例

{
  "code": 0,
  "data": {
    "batch_id": "2bb2f0ec-a336-4a0a-b61a-241afaf9cc87",
    "extract_result": [
      {
        "file_name": "example.pdf",
        "state": "done",
        "err_msg": "",
        "full_zip_url": "https://cdn-mineru.openxlab.org.cn/pdf/018e53ad-d4f1-475d-b380-36bf24db9914.zip"
      },
      {
        "file_name": "demo.pdf",
        "state": "running",
        "err_msg": "",
        "extract_progress": {
          "extracted_pages": 1,
          "total_pages": 2,
          "start_time": "2025-01-20 11:43:20"
        }
      }
    ]
  },
  "msg": "ok",
  "trace_id": "c876cd60b202f2396de1f9e39a1b0172"
}
よくあるエラーコード
エラーコード	説明	対処方法
A0202	Token エラー	Token が正しいか確認。Bearer プレフィックスの有無を確認するか、新しい Token に差し替え
A0211	Token 期限切れ	新しい Token に差し替え
-500	パラメータエラー	パラメータ型および Content-Type が正しいことを確認
-10001	サービス異常	しばらくしてから再試行
-10002	リクエストパラメータエラー	リクエストパラメータ形式を確認
-60001	アップロード URL 生成失敗。しばらくしてから再試行	しばらくしてから再試行
-60002	一致するファイル形式の取得失敗	ファイルタイプ検出失敗。リクエストのファイル名およびリンクに正しい拡張子があり、ファイルが pdf,doc,docx,ppt,pptx,png,jp(e)g のいずれかであることを確認
-60003	ファイル読み取り失敗	ファイルが破損していないか確認し、再アップロード
-60004	空ファイル	有効なファイルをアップロード
-60005	ファイルサイズ超過	ファイルサイズを確認。最大 200MB
-60006	ファイルページ数超過	ファイルを分割して再試行
-60007	モデルサービス一時利用不可	しばらくして再試行するか、テクニカルサポートに連絡
-60008	ファイル読み取りタイムアウト	URL がアクセス可能か確認
-60009	タスク送信キューが満杯	しばらくしてから再試行
-60010	解析失敗	しばらくしてから再試行
-60011	有効なファイルの取得失敗	ファイルがアップロード済みであることを確認
-60012	タスクが見つからない	task_id が有効で削除されていないことを確認
-60013	当該タスクへのアクセス権限なし	自身が送信したタスクのみアクセス可能
-60014	実行中タスクの削除	実行中タスクの削除は非対応
-60015	ファイル変換失敗	手動で pdf に変換してからアップロード可能
-60016	ファイル変換失敗	指定形式への変換失敗。他形式でのエクスポートまたは再試行を検討
-60017	リトライ回数上限到達	後続のモデルアップグレード後に再試行
-60018	1 日の解析タスク数上限到達	翌日再試行
-60019	html ファイル解析クォータ不足	翌日再試行
-60020	ファイル分割失敗	しばらくしてから再試行
-60021	ファイルページ数読み取り失敗	しばらくしてから再試行
-60022	Web ページ読み取り失敗	ネットワーク問題またはレート制限により失敗した可能性。しばらくしてから再試行
