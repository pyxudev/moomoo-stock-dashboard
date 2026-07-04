# 株式分析ダッシュボード 設計書 v1.0

## 1. システム概要

### 目的

Moomoo
APIを利用し、日本株（東証）の株価情報をリアルタイムに取得し、登録した銘柄のみを監視・分析できるWebアプリケーションを提供する。

本システムは以下を目的とする。

-   保有株のリアルタイム監視
-   取得単価の管理
-   評価損益の可視化
-   売買シミュレーション
-   将来的なAI分析機能への拡張

------------------------------------------------------------------------

## 2. システム構成

``` text
Browser (Next.js)

    │
    │ REST API / WebSocket
    ▼

FastAPI

├── Auth
├── Watchlist
├── Portfolio
├── Simulation
├── Chart Service
└── Quote Service

    │
    ├──────── SQLite
    │
    └──────── Moomoo OpenD
                  │
            Moomoo API
```

## 3. 技術構成

  項目          技術
  ------------- -------------------------
  Frontend      Next.js
  UI            Tailwind CSS
  Chart         Lightweight Charts
  Backend       FastAPI
  ORM           SQLAlchemy
  Database      SQLite
  Market Data   Moomoo Python SDK
  Realtime      WebSocket
  Container     Docker / Docker Compose
  Config        `.env`

## 4. 機能一覧

### 4.1 ウォッチリスト

-   東証銘柄検索
-   お気に入り登録
-   削除
-   並び替え
-   重複登録不可

### 4.2 チャート

-   最大8画面表示
-   月足・日足・15分足
-   最大3年分
-   WebSocketリアルタイム更新

### 4.3 保有株管理

-   取得価格
-   株数
-   購入日
-   メモ
-   編集・削除

### 4.4 複数ポジション

-   同一銘柄へ複数取得単価登録
-   色付き水平線表示
-   現在価格との差額表示

### 4.5 評価損益

-   評価額
-   評価損益
-   評価損益率
-   総資産
-   総評価損益

### 4.6 売買シミュレーション

-   初期資金1,000万円
-   売買シミュレーション
-   ワンクリックリセット

### 4.7 日次集計

-   評価額
-   評価損益
-   実現損益
-   保有株数

## 5. API

``` text
GET    /watchlist
POST   /watchlist
DELETE /watchlist/{id}

GET    /quote/{symbol}
GET    /chart/{symbol}

GET    /positions
POST   /positions
PUT    /positions/{id}
DELETE /positions/{id}

POST   /simulation/buy
POST   /simulation/sell
POST   /simulation/reset

GET    /summary
```

## 6. 非機能要件

-   Windows / macOS / Linux
-   Docker Compose対応
-   SQLite採用
-   一般的なノートPCで動作
-   `.env`による環境設定

### .env

``` env
MOOMOO_HOST=opend
MOOMOO_PORT=11111
DB_PATH=/data/db.sqlite3
TZ=Asia/Tokyo
WS_REFRESH_INTERVAL=1000
DEFAULT_MARKET=JP
INITIAL_SIMULATION_MONEY=10000000
MAX_CHART_WINDOWS=8
MAX_HISTORY_YEARS=3
```

## 7. 将来の拡張

-   AI売買シグナル
-   テクニカル分析
-   アラート
-   決算・ニュース
-   PostgreSQL対応
-   認証機能
-   ダークモード
-   バックテスト
