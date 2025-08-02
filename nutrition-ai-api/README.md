# 栄養管理師AI - REST API

GPTs連携用のREST APIサーバー。Firebase + Google Vision APIを使用した栄養分析システム。

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **データベース**: Firebase Firestore
- **認証**: Firebase Auth
- **ストレージ**: Firebase Storage
- **AI**: Google Vision API
- **デプロイ**: Vercel
- **言語**: TypeScript

## 📋 主要機能

### 認証系
- `POST /api/auth/validate` - パスワード認証

### 食事管理系
- `POST /api/meals/analyze` - 画像による食事分析
- `PUT /api/meals/analyze` - テキストによる食事入力

### ユーザー管理系
- `GET /api/users/[userId]` - ユーザー情報取得
- `POST /api/users/[userId]` - ユーザー作成
- `PUT /api/users/[userId]` - ユーザー更新

## 🚀 セットアップ

### 1. 依存関係インストール
```bash
npm install
```

### 2. 環境変数設定
`.env.example`をコピーして`.env.local`を作成：

```bash
cp .env.example .env.local
```

### 3. Firebase設定
1. [Firebase Console](https://console.firebase.google.com)でプロジェクト作成
2. Firestore Database有効化
3. Authentication設定
4. Storage設定
5. プロジェクト設定から設定値を取得

### 4. Google Cloud Vision API設定
1. [Google Cloud Console](https://console.cloud.google.com)でプロジェクト作成
2. Vision API有効化
3. サービスアカウント作成
4. 認証キー取得

### 5. 開発サーバー起動
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the API.

## 📊 API エンドポイント

### 認証テスト
```bash
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"password":"your_password"}'
```

### 食事分析テスト
```bash
curl -X POST http://localhost:3000/api/meals/analyze \
  -F "image=@meal_image.jpg" \
  -F "userId=test_user_123" \
  -F "mealType=lunch"
```

## 📦 デプロイ

### Vercel デプロイ
```bash
# Vercel CLI インストール
npm i -g vercel

# デプロイ
vercel
```

詳細なセットアップとドキュメントは、メインリポジトリの[CONCEPT.md](../CONCEPT.md)を参照してください。
