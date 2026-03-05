# プロジェクト情報 - 健康管理アプリ

このファイルは、今後のカスタマイズをスムーズに進めるための重要な情報をまとめています。

## 📁 プロジェクト構成

```
health-app/
├── index.html          # メインHTML（構造・レイアウト）
├── style.css           # スタイルシート（デザイン・見た目）
├── app.js              # メインロジック（機能・動作）
├── manifest.json       # PWA設定（アプリ情報）
├── sw.js               # Service Worker（オフライン対応）
├── README.md           # プロジェクト説明書
├── DEPLOY.md           # デプロイ手順書
├── .gitignore          # Git除外設定
└── PROJECT_INFO.md     # このファイル（開発情報）
```

## 🎯 アプリの主要機能

### 1. ダッシュボード（tab-dashboard）
- **ファイル**: `index.html` (行1-100), `app.js` (行85-200)
- **機能**: 
  - 体重・BMI表示
  - 今日のカロリー収支
  - 今日の運動消費
  - 昨夜の睡眠時間
  - 3つのグラフ（体重30日、カロリー7日、睡眠7日）

### 2. 体重管理（tab-weight）
- **ファイル**: `index.html` (行101-150), `app.js` (行250-350)
- **機能**:
  - 身長設定
  - 体重記録（日付・体重）
  - BMI自動計算
  - 体重履歴表示
  - 削除機能

### 3. 食事管理（tab-meal）
- **ファイル**: `index.html` (行151-220), `app.js` (行400-550)
- **機能**:
  - 目標カロリー設定
  - 食事記録（名前・カロリー・種類・日付）
  - クイック登録（よく食べる食事）
  - 今日の食事一覧
  - 過去の記録
  - カロリー進捗バー

### 4. 運動管理（tab-exercise）
- **ファイル**: `index.html` (行221-280), `app.js` (行600-700)
- **機能**:
  - 運動記録（種類・時間・消費カロリー・メモ・日付）
  - 今日の運動一覧
  - 過去の記録
  - 合計消費カロリー表示

### 5. 睡眠管理（tab-sleep）
- **ファイル**: `index.html` (行281-350), `app.js` (行750-900)
- **機能**:
  - 目標睡眠時間設定
  - 睡眠記録（就寝・起床時刻・質・日付）
  - 睡眠時間自動計算
  - 睡眠履歴
  - 7日間の平均統計

## 💾 データ構造（LocalStorage）

### settings
```javascript
{
  height: 170,           // 身長（cm）
  targetCalorie: 2000,   // 目標カロリー（kcal）
  targetSleep: 7.5       // 目標睡眠時間（時間）
}
```

### weights
```javascript
[
  {
    id: 1234567890,      // タイムスタンプID
    date: "2026-03-04",  // 日付
    weight: 65.5         // 体重（kg）
  }
]
```

### meals
```javascript
[
  {
    id: 1234567890,
    date: "2026-03-04",
    name: "朝食",
    calorie: 500,
    type: "朝食"         // 朝食/昼食/夕食/間食
  }
]
```

### exercises
```javascript
[
  {
    id: 1234567890,
    date: "2026-03-04",
    type: "ランニング",
    duration: 30,        // 分
    calorie: 300,
    memo: "公園で"
  }
]
```

### sleeps
```javascript
[
  {
    id: 1234567890,
    date: "2026-03-04",
    start: "23:00",
    end: "07:00",
    duration: 8.0,       // 時間
    quality: 4           // 1-5の評価
  }
]
```

## 🎨 デザインシステム

### カラーパレット（style.css）
- **プライマリ**: `#0ea5e9` (青) - メインボタン、アクセント
- **成功**: `#22c55e` (緑) - 運動、ポジティブ
- **警告**: `#f59e0b` (オレンジ) - 食事、注意
- **エラー**: `#ef4444` (赤) - 削除、危険
- **紫**: `#6366f1` - 睡眠
- **背景**: `#f8fafc` (薄いグレー)
- **カード**: `#ffffff` (白)

### レスポンシブブレークポイント
- **モバイル**: 〜768px
- **タブレット**: 768px〜1024px
- **デスクトップ**: 1024px〜

## 🔧 主要な関数（app.js）

### データ管理
- `DB.get(key)` - 配列データ取得
- `DB.getObj(key, default)` - オブジェクトデータ取得
- `DB.set(key, value)` - データ保存

### UI更新
- `showTab(tabName)` - タブ切り替え
- `showToast(message)` - 通知表示
- `updateDashboard()` - ダッシュボード更新

### 体重関連
- `saveHeight()` - 身長保存
- `addWeight()` - 体重追加
- `calcBMI(weight, height)` - BMI計算
- `deleteWeight(id)` - 体重削除
- `updateWeightChart()` - 体重グラフ更新

### 食事関連
- `saveTargetCalorie()` - 目標カロリー保存
- `addMeal()` - 食事追加
- `quickAdd(name, calorie)` - クイック登録
- `deleteMeal(id)` - 食事削除
- `updateCalorieChart()` - カロリーグラフ更新

### 運動関連
- `addExercise()` - 運動追加
- `deleteExercise(id)` - 運動削除

### 睡眠関連
- `saveTargetSleep()` - 目標睡眠時間保存
- `addSleep()` - 睡眠追加
- `selectQuality(quality)` - 睡眠の質選択
- `calcSleepDuration(start, end)` - 睡眠時間計算
- `deleteSleep(id)` - 睡眠削除
- `updateSleepChart()` - 睡眠グラフ更新

### ユーティリティ
- `getTodayStr()` - 今日の日付取得（YYYY-MM-DD）
- `formatDateJP(dateStr)` - 日本語日付フォーマット
- `formatDateShort(dateStr)` - 短い日付フォーマット
- `getDateBefore(dateStr, days)` - N日前の日付取得

## 📊 使用ライブラリ

### Chart.js (v3.9.1)
- **CDN**: `https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js`
- **用途**: グラフ描画（折れ線グラフ、棒グラフ）
- **インスタンス**: `weightChart`, `calorieChart`, `sleepChart`

## 🚀 デプロイ状態

### Git情報
- **ブランチ**: `master`
- **リモート**: 未設定（ローカルのみ）
- **コミット**: 初回コミット完了（7ファイル、2090行）

### GitHub Pages設定
- **手順**: DEPLOY.md参照
- **重要**: ブランチ名は `master` を選択すること

## 💡 カスタマイズのヒント

### 新機能を追加する場合
1. **HTML**: `index.html` に新しいタブセクションを追加
2. **CSS**: `style.css` にスタイルを追加
3. **JS**: `app.js` に機能を実装
4. **データ**: LocalStorageキーを追加

### デザインを変更する場合
- **色**: `style.css` の `:root` セクションでCSS変数を定義
- **レイアウト**: `.container`, `.card`, `.grid` クラスを調整
- **フォント**: `font-family` を変更

### グラフをカスタマイズする場合
- **Chart.js設定**: `app.js` の各 `update*Chart()` 関数を編集
- **色**: `backgroundColor`, `borderColor` を変更
- **期間**: `days` 変数を変更（現在：体重30日、他7日）

### PWA設定を変更する場合
- **アプリ名**: `manifest.json` の `name`, `short_name`
- **色**: `manifest.json` の `theme_color`, `background_color`
- **アイコン**: 192x192, 512x512のPNG画像を追加

## 🐛 既知の制限事項

1. **データバックアップ**: LocalStorageのみ（エクスポート機能なし）
2. **画像**: アイコン画像が未設定（PWA用）
3. **多言語**: 日本語のみ
4. **認証**: なし（個人利用想定）
5. **同期**: デバイス間のデータ同期なし

## 📝 今後の改善案

- [ ] データエクスポート/インポート機能
- [ ] グラフの期間カスタマイズ
- [ ] 目標達成通知
- [ ] 食事の写真記録
- [ ] 運動の自動カロリー計算
- [ ] 体重目標設定と進捗表示
- [ ] ダークモード対応
- [ ] 多言語対応

## 🔗 関連リンク

- **Chart.js ドキュメント**: https://www.chartjs.org/docs/latest/
- **PWA ガイド**: https://web.dev/progressive-web-apps/
- **GitHub Pages**: https://pages.github.com/

---

**最終更新**: 2026/3/4
**バージョン**: 1.0.0
**開発環境**: Windows 11, VS Code

このファイルは次回のカスタマイズ時に必ず読み込んでください！
