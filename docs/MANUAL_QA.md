# 最終QA記録

- 対象: 個人事業主 税金予測シミュレーター
- 税制年度: 2026年分（令和8年分）
- 税制確認日: 2026-08-08
- 実施日: 2026-08-08
- ローカル確認: Firebase Hosting Emulator / `http://127.0.0.1:5006`
- 本番URL: https://freelance-tax-kj-019fe135.web.app
- ブラウザ: Codex in-app browser（Chromium系、正確なバージョンは取得不可）

未確認項目を推測で合格にせず、自動テスト、DOM確認、画面確認、HTTP確認を分けて記録しています。

## 自動検証

`npm run verify` を最終実行しました。

| 確認 | 結果 |
| --- | --- |
| ESLint | PASS |
| TypeScript / Next route type generation | PASS |
| Vitest | PASS — 4ファイル、84件 |
| Next.js static build | PASS — `/`、`/_not-found`、`/icon.svg`、`/manifest.webmanifest` |

84件のテストには、2026年設定、所得税基礎控除と7税率区分の境界、復興特別所得税、青色申告控除、住民税、個人事業税、国民年金、消費税4方式、端数、途中開業、月別と年間の一致、実績／予測、納税準備額、4シナリオを含みます。

## 実ブラウザ確認

| ID | 確認内容 | 結果 |
| --- | --- | --- |
| UI-01 | 初期表示、2026年分、概算、架空サンプル、端末内保存の説明 | PASS |
| UI-02 | 年商300万・600万・1,000万・1,500万円を順に選択 | PASS — 各主要値が即時更新 |
| UI-03 | 基本情報→売上→経費→控除→その他→結果の全ステップ遷移 | PASS — 見出しと進捗表示が一致 |
| UI-04 | 売上累計を7,000,000円へ変更 | PASS — 予想負担が即時更新 |
| UI-05 | 年末予測／現在までの実績を切り替え | PASS — 主要負担額が切り替わることをDOMで確認 |
| UI-06 | 税目別内訳、所得税計算フロー、月別グラフ・表、4シナリオ、納税時期 | PASS — 画面とDOMに表示 |
| UI-07 | 「計算根拠を見る」を展開 | PASS — 年度、所得、控除、標準住民税、確認日、公的リンクを表示 |
| DATA-01 | 入力変更後に待機して再読み込み | PASS — 7,000,000円をlocalStorageから復元 |
| DATA-02 | 「新しく入力」 | PASS — 売上累計0円へ初期化後、架空サンプルを再読込可能 |
| DATA-03 | クラウド送信の有無 | PASS — サーバー処理・認証・DB・入力送信用APIなし。静的ファイルとlocalStorageのみ |
| ROBUST-01 | 初回表示から主要操作後までのコンソール | PASS — error / warning 0件 |
| ROBUST-02 | リロード後の表示と保存状態 | PASS — 404、hydration mismatch、入力消失なし |

## レスポンシブ確認

| 表示 | 結果 |
| --- | --- |
| PC 1440 × 1000指定 | PASS — 入力＋LIVE予測、結果、シナリオを確認 |
| タブレット 768 × 1024指定 | PASS — `documentElement.clientWidth === scrollWidth`、全ステップ遷移成功 |
| スマートフォン 390 × 844指定 | PASS — 実描画375 × 812、ページ全体の横はみ出しなし、下部結果バーと結果カードを確認 |

ステップナビや選択肢の横スクロール領域は、狭幅でも全選択肢へ到達できるよう意図したコンポーネント内スクロールです。ページ全体には横スクロールがありません。

## アクセシビリティ確認

| 確認 | 結果 |
| --- | --- |
| `html lang="ja"`、見出し構造、main / nav / aside / footer | PASS（DOM確認） |
| 入力label、group名、現在ステップ、aria-live、結果region、グラフ代替説明 | PASS（DOM確認） |
| `:focus-visible` と色以外の状態ラベル | PASS（コード・画面確認） |
| `prefers-reduced-motion: reduce` | PASS（コード確認） |
| スクリーンリーダー実機、200%ズーム | 未実施 — 次回回帰確認項目 |

## 本番配信確認

| 確認 | 結果 |
| --- | --- |
| Firebase専用サイト | PASS — `freelance-tax-kj-019fe135` のみへデプロイ |
| HTTP応答 | PASS — 200 / `text/html; charset=utf-8` |
| キャッシュ | PASS — HTMLは `no-cache`、静的アセットは長期キャッシュ設定 |
| セキュリティヘッダー | PASS — CSP、`nosniff`、Referrer-Policy、Permissions-Policyを実応答で確認 |
| 本番初期表示と主要操作 | PASS |

## スクリーンショット

すべて本番URL・年商600万円の架空サンプルで撮影し、PNG形式へ正規化しました。

- [x] `docs/screenshots/desktop-overview.png`
- [x] `docs/screenshots/desktop-results.png`
- [x] `docs/screenshots/desktop-scenarios.png`
- [x] `docs/screenshots/mobile-input.png`
- [x] `docs/screenshots/mobile-results.png`

## 既知の注意

- 年商1,000万円サンプルは8月までの整数累計を12か月へ年換算するため、丸めにより画面上10,000,001円になります。税計算の1円単位を保つための表示差で、他の計算不整合ではありません。
- 住民税の自治体差、国保の自動算定、各控除の適用要件、消費税の複雑な課税判定などはREADME記載どおり概算・対象外です。
- スクリーンリーダー実機と200%ズームは未実施ですが、リリースを妨げるコンソールエラー、ページ全体の横はみ出し、主要操作不能は確認されませんでした。

総合判定: PASS（公開可能）。
