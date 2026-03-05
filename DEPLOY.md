# GitHub Pagesへのデプロイ手順 🚀

このファイルでは、健康管理アプリをGitHub Pagesで公開し、iPhoneからアクセスできるようにする手順を説明します。

## ステップ1: GitHubアカウントの準備

1. **GitHubアカウントを作成**（まだない場合）
   - https://github.com にアクセス
   - 「Sign up」をクリック
   - メールアドレス、パスワード、ユーザー名を設定

## ステップ2: GitHubリポジトリの作成

1. **GitHubにログイン**
   - https://github.com にアクセス

2. **新しいリポジトリを作成**
   - 右上の「+」→「New repository」をクリック
   - Repository name: `health-app`（または任意の名前）
   - Description: `健康管理PWAアプリ`
   - Public を選択（無料でGitHub Pagesを使うため）
   - 「Create repository」をクリック

3. **リポジトリのURLをコピー**
   - 作成後に表示されるURLをコピー
   - 例: `https://github.com/あなたのユーザー名/health-app.git`

## ステップ3: ローカルリポジトリをGitHubにプッシュ

### 方法A: コマンドラインを使う場合

```bash
# リモートリポジトリを追加
git -C c:/Users/yuya1/.claude/workspace/health-app remote add origin https://github.com/あなたのユーザー名/health-app.git

# ブランチ名をmainに変更（GitHubの標準に合わせる）
git -C c:/Users/yuya1/.claude/workspace/health-app branch -M main

# GitHubにプッシュ
git -C c:/Users/yuya1/.claude/workspace/health-app push -u origin main
```

### 方法B: GitHub Desktopを使う場合

1. GitHub Desktopをダウンロード・インストール
2. 「File」→「Add Local Repository」
3. `c:/Users/yuya1/.claude/workspace/health-app` を選択
4. 「Publish repository」をクリック

### 方法C: ブラウザから直接アップロード

1. GitHubのリポジトリページで「uploading an existing file」をクリック
2. health-appフォルダ内の全ファイルをドラッグ&ドロップ
3. 「Commit changes」をクリック

## ステップ4: GitHub Pagesを有効化

1. **リポジトリの設定を開く**
   - リポジトリページで「Settings」タブをクリック

2. **Pagesセクションに移動**
   - 左サイドバーの「Pages」をクリック

3. **ソースを設定**
   - Source: `Deploy from a branch`
   - Branch: `main` を選択
   - Folder: `/ (root)` を選択
   - 「Save」をクリック

4. **公開URLを確認**
   - 数分待つと、ページ上部に緑色のバーが表示されます
   - 「Your site is live at https://あなたのユーザー名.github.io/health-app/」
   - このURLをコピー

## ステップ5: iPhoneでアクセス

1. **iPhoneのSafariでURLを開く**
   - `https://あなたのユーザー名.github.io/health-app/` にアクセス

2. **ホーム画面に追加**
   - 画面下部の共有ボタン（□に↑）をタップ
   - 「ホーム画面に追加」をタップ
   - アプリ名を確認して「追加」をタップ

3. **アプリとして使用**
   - ホーム画面にアイコンが追加されます
   - タップするとアプリのように全画面で起動します
   - オフラインでも動作します（PWA機能）

## トラブルシューティング

### ページが表示されない場合
- GitHub Pagesの有効化後、5〜10分待ってから再度アクセス
- ブラウザのキャッシュをクリア
- URLが正しいか確認（末尾に `/` があるか）

### 認証エラーが出る場合
- GitHubの個人アクセストークンを作成
  1. GitHub Settings → Developer settings → Personal access tokens
  2. 「Generate new token」
  3. `repo` にチェック
  4. トークンをコピーして、パスワードの代わりに使用

### ファイルが更新されない場合
```bash
# 変更をコミット
git -C c:/Users/yuya1/.claude/workspace/health-app add .
git -C c:/Users/yuya1/.claude/workspace/health-app commit -m "Update"
git -C c:/Users/yuya1/.claude/workspace/health-app push
```

## 次のステップ

✅ アプリが公開されました！
- URLを友達や家族と共有できます
- カスタムドメインを設定することも可能です
- アプリを更新したい場合は、ファイルを編集してpushするだけです

---

📱 **iPhoneでの使用を楽しんでください！**
