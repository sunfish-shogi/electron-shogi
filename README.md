# Electron 将棋


[![Test](https://github.com/sunfish-shogi/electron-shogi/actions/workflows/test.yml/badge.svg?branch=main&event=push)](https://github.com/sunfish-shogi/electron-shogi/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/sunfish-shogi/electron-shogi/branch/main/graph/badge.svg?token=TLSQXAIJFY)](https://codecov.io/gh/sunfish-shogi/electron-shogi)

将棋の GUI アプリです。
コンピューターとの対局や棋譜の編集・検討ができます。

[将棋所](http://shogidokoro.starfree.jp/)と同様に [USI プロトコル](http://shogidokoro.starfree.jp/usi.html) 対応の思考エンジンを利用できます。

## コンセプト

私達は既に将棋所や[ShogiGUI](http://shogigui.siganus.com/)などの洗練されたソフトウェアで将棋の対局や研究が可能です。
しかし、その多くは個人がクローズドに開発しているものです。
コンピューター将棋界の権威ある開発者も[オープンソースのGUIの必要性に言及](https://yaneuraou.yaneu.com/2022/01/15/new-gui-for-shogi-is-needed-to-improve-the-usi-protocol/)しています。
Electron 将棋はオープンソースであり、そして低い制限のもとで自由に利用・改変が可能です。

また、 Web の技術を使うことで幅広い活用を目指します。
USI エンジンを呼び出す機能やファイル操作を除いて、多くの機能がブラウザで利用できます。
将来は[Tauri](https://github.com/tauri-apps/tauri)版の制作やスマホ対応を行うことも視野に入れています。

## Web サイト

https://sunfish-shogi.github.io/electron-shogi/

リンク先からブラウザ版アプリを試すことができます。

## スクリーンショット

![スクリーンショット1](docs/screenshots/screenshot001.png)

![スクリーンショット2](docs/screenshots/screenshot002.png)

![スクリーンショット3](docs/screenshots/screenshot003.png)

## ダウンロード

[Releases](https://github.com/sunfish-shogi/electron-shogi/releases) から Windows 版、Mac 版をダウンロードできます。
Linux 版のバイナリはありませんので、後述のコマンドでビルドしてください。

## 要望・提案・不具合報告

GitHub のアカウントをお持ちの方は Issue/PullRequest を活用してください。
設計に関する意見も歓迎です。
軽微ではない Pull Request を作成する場合は必ず実装前にIssueでご相談ください。作業が競合したり設計方針を合意できないと、せっかく実装いただいた内容を取り込めない場合があります。

GitHub アカウントをお持ちでない場合は [送信フォーム](https://form.run/@sunfish-shogi-1650819491) でご連絡ください。

開発の進捗状況は [プロジェクトボード](https://github.com/users/sunfish-shogi/projects/1/views/1) を参照してください。

## 開発

### 必要なもの

- Node.js

### セットアップ

```
git clone https://github.com/sunfish-shogi/electron-shogi.git
cd electron-shogi
npm install
```

### 起動

```
# Electron アプリ
npm run electron:serve

# ブラウザアプリ
npm run serve
```

### リリース

```
# Electron アプリ
npm run electron:build

# ブラウザアプリ
npm run build
```

### ユニットテスト

```
npm run test:unit
```

### Lint

```
npm run lint
```

## ライセンス

### Electron 将棋のライセンス

[MIT License](LICENSE)

### アイコン画像のライセンス

[/public/icon](https://github.com/sunfish-shogi/electron-shogi/tree/main/public/icon) 配下のアイコン画像は[Material Icons](https://google.github.io/material-design-icons/) を使用しています。
これには[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt)が適用されます。

### 依存モジュールのライセンス

レンダラープロセスで使用しているライブラリは [THIRD PARTY LICENSES](https://sunfish-shogi.github.io/electron-shogi/third-party-licenses.html) を参照してください。

Electron と Chromium については Electron Builder によって成果物にバンドルされます。
