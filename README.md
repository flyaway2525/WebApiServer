# WebApiServer

React Web クライアント、将来の Unity クライアント、Express API の共通バックエンドを想定した初期実装です。

## Structure

- `api`: Express + TypeScript + Swagger + local SQLite storage
- `web`: React + Vite の Web クライアント

## Current Status

- Web サーバーと API サーバーはローカルで起動確認済みです
- Swagger UI から API 実行を確認済みです
- グローバル Node.js なしで動くように、ローカル配置の Node.js を使う構成です
- Join Space では共有リンクや QR 文字列を貼り付けてスペースコードを抽出できます

## Quick Start

1. ルートで `setup.bat` を実行する
2. 初回セットアップ完了後に `setup.bat dev` を実行する

## Local Setup

- `setup.bat` は `WebApiServer/.tools/node/current` にポータブル版 Node.js を展開します
- Node.js はグローバルにはインストールしません
- `api/.env` が無ければ `api/.env.example` から自動生成します
- 依存関係はワークスペースのルートで `npm install` します
- 統合ターミナルは `.vscode/settings.json` でワークスペース内の Node.js を優先する設定です

## VS Code Tasks

- `Terminal > Run Task...` から `Setup Local Environment` を選ぶと、ローカル Node.js 導入と依存関係のセットアップを実行できます
- `Start Development Environment` で API と Web を同時起動できます
- `Start API Only` と `Start Web Only` で個別起動もできます
- `Build Workspace` で API と Web のビルド確認を実行できます

## VS Code Run and Debug

- `Run and Debug` から `Run Full Stack` を選ぶと、事前タスク `Setup Local Environment` を実行してから API と Web を起動できます
- `API` は Express サーバーをローカル Node.js で起動します
- `Web` は Vite 開発サーバーをローカル Node.js で起動します
- Web 起動後は `http://localhost:5173` を自動でブラウザ表示します
- 停止するときは `Shift+F5` または Run and Debug の停止ボタンを使います

### Extra Commands

- `setup.bat build`: API と Web をビルドする
- `setup.bat dev:api`: API のみ起動する
- `setup.bat dev:web`: Web のみ起動する
- `setup.bat npm test`: ローカル Node.js で任意の npm コマンドを実行する
- `LOCAL_NODE_MAJOR=22 setup.bat`: 取得する Node.js のメジャーバージョンを切り替える

## Local URLs

- Web: `http://localhost:5173`
- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`
- Health Check: `http://localhost:3000/health`

## Troubleshooting

- Run and Debug の Web 起動で `Unknown option --root` が出る場合は、Web の launch 設定が `cwd=web` で `vite.config.ts` を読みに行く形になっているか確認してください
- `localhost:5173` が 404 の場合は、古い Web デバッグプロセスが残っていないか確認して再起動してください
- Vite が `5174` など別ポートに逃げる場合は、`5173` を使っている既存プロセスを停止してください
- `npm` が PowerShell の実行ポリシーで失敗する場合は、VS Code をリロードして新しい統合ターミナルを開いてください
- `./data/app.db` を開けないエラーが出る場合は、API の DB 初期化順序が崩れていないか確認してください

## Next Steps

- 認証方式を決める
- Unity クライアント用の API 契約を追加する
- 永続化層を本番向け DB に置き換える
