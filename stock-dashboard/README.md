# 株式分析ダッシュボード

日本株（東証）のリアルタイム監視・分析Webアプリ。

## 必要なもの

- Docker & Docker Compose
- Moomoo (moomoo証券) アカウント + OpenD 起動済み

## セットアップ

### 1. OpenD の確認

OpenD がローカルで起動していることを確認してください。
デフォルトポートは `11111`。

### 2. .env の確認

```env
MOOMOO_HOST=host.docker.internal   # Docker内からホストのOpenDへ接続
MOOMOO_PORT=11111
```

Linux の場合は `docker-compose.yml` の `extra_hosts` の設定により
`host.docker.internal` が自動的にホストIPに解決されます。

### 3. 起動

```bash
docker compose up --build
```

初回ビルドは数分かかります。

### 4. ブラウザでアクセス

```
http://localhost:3000
```

## 使い方

### ウォッチリスト
- 銘柄コード（例: `7203`）または銘柄名で検索して追加
- サイドバーの銘柄をクリックするとチャートパネルに表示

### チャートパネル
- 最大8銘柄を同時表示
- 月足 / 日足 / 15分足 を切り替え可能
- ✕ ボタンで個別に閉じられます

### ポートフォリオ
- 取得単価・株数・購入日・メモを管理
- 現在値はMoomooから自動取得して評価損益をリアルタイム計算

### シミュレーション
- 初期資金1,000万円で売買シミュレーション
- 残高・損益・取引履歴を管理
- ワンクリックリセット

## API

- FastAPI: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

## ディレクトリ構成

```
stock-dashboard/
├── docker-compose.yml
├── .env
├── backend/
│   ├── main.py          # FastAPI エントリポイント + WebSocket
│   ├── config.py        # 環境変数設定
│   ├── database.py      # SQLAlchemy モデル
│   ├── routers/         # API ルーター
│   └── services/
│       └── moomoo_service.py  # Moomoo SDK ラッパー
└── frontend/
    └── src/
        ├── app/         # Next.js App Router
        ├── components/  # UI コンポーネント
        └── lib/api.ts   # API クライアント
```

## トラブルシューティング

**OpenDに接続できない場合**
- OpenDが起動しているか確認
- `MOOMOO_HOST` / `MOOMOO_PORT` が正しいか確認
- Linux: `extra_hosts: host.docker.internal:host-gateway` が `docker-compose.yml` にあることを確認

**チャートが表示されない場合**
- Moomoo の日本株データ購読が有効か確認
- `http://localhost:8000/docs` でAPIを直接テストしてみてください
