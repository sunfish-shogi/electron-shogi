# Electron 将棋 (Electron Shogi)

[![Test](https://github.com/sunfish-shogi/electron-shogi/actions/workflows/test.yml/badge.svg?branch=main&event=push)](https://github.com/sunfish-shogi/electron-shogi/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/sunfish-shogi/electron-shogi/branch/main/graph/badge.svg?token=TLSQXAIJFY)](https://codecov.io/gh/sunfish-shogi/electron-shogi)

将棋の GUI アプリです。
コンピューターとの対局や棋譜の編集・検討ができます。

This is Shogi GUI app.
You can play Shogi with AI and manage records.

[将棋所](http://shogidokoro.starfree.jp/)と同様に [USI プロトコル](http://shogidokoro.starfree.jp/usi.html) 対応の思考エンジンを利用できます。

You can use this app with any Shogi engine(AI) based on [USI Protocol](http://shogidokoro.starfree.jp/usi.html), just like [将棋所](http://shogidokoro.starfree.jp/).

## コンセプト (Concept)

私達は既に将棋所や[ShogiGUI](http://shogigui.siganus.com/)などの洗練されたソフトウェアで将棋の対局や研究が可能です。
しかし、その多くは個人がクローズドに開発しているものです。
コンピューター将棋界の権威ある開発者も[オープンソースのGUIの必要性に言及](https://yaneuraou.yaneu.com/2022/01/15/new-gui-for-shogi-is-needed-to-improve-the-usi-protocol/)しています。
Electron 将棋はオープンソースであり、そして低い制限のもとで自由に利用・改変が可能です。

We can already use excellent softwares such as 将棋所 and [ShogiGUI](http://shogigui.siganus.com/) etc.
However, most of them are not open-source projects.
The authority of Shogi AI advocates [importance of open-source Shogi GUI](https://yaneuraou.yaneu.com/2022/01/15/new-gui-for-shogi-is-needed-to-improve-the-usi-protocol/).
Electron Shogi is open-source. And you can use/modify under only few limits.

Electron 将棋は Web ベースの GUI フレームワークである [Electron](https://www.electronjs.org/) を使っています。
Web の技術を使うことで将来の幅広い活用を目指しており、機能は限られますが通常のブラウザでも動作します。
Electron は Chromium をバンドルするため、どの OS でも同じ操作性と品質が担保しやすいのも特徴です。

Electron Shogi is developed by [Electron](https://www.electronjs.org/) which is web based GUI framework.
We want to use this project to wide usages by making use of modern web technologies on the future.
Currently, you can use the part of features on your web browser.
Electron based app bundles Chromium, so it is easy to keep quality regardless of OS or its versions.

昨今では 2in1 タブレットやコンバーチブル型 PC の普及により、PC 向けの OS でもタッチパネルを使って将棋の対局ができるようになりました。
しかし、 PC 向けの伝統的なアプリケーションは UI コンポーネントが細かく、タッチ操作との相性がよくありません。
Electron 将棋ではタッチ操作のしやすさも重視して UI を設計しています。

These days, 2-in-1 tablet and convertible PC are becoming popular.
So, it is possible to play shogi on PC with touch screen.
However, legacy desktop Shogi apps have very small UI components. So it's not good for compatibility with touch display.
We design this app to have operability for touch devices.

## Website

https://sunfish-shogi.github.io/electron-shogi/

ウェブサイトではブラウザ版アプリを試すことができます。

You can try web version from the website.

## Wiki

https://github.com/sunfish-shogi/electron-shogi/wiki

使い方や設計に関する情報はこちらを参照してください。

## スクリーンショット (Screenshots)

![スクリーンショット1](docs/screenshots/screenshot001.png)

![スクリーンショット2](docs/screenshots/screenshot002.png)

![スクリーンショット3](docs/screenshots/screenshot003.png)

## ダウンロード (Downloads)

[Releases](https://github.com/sunfish-shogi/electron-shogi/releases) からダウンロードできます。

## エンジン開発者の方へ (For Developers)

USI や CSA プロトコルの通信ログの出力はデフォルトで無効です。
[こちら](https://github.com/sunfish-shogi/electron-shogi/wiki/%E4%BD%BF%E3%81%84%E6%96%B9#%E3%83%AD%E3%82%B0%E5%87%BA%E5%8A%9B) を参考に設定してください。

スクリプトファイルをエンジンとして登録できないという問い合わせが複数来ています。 [シェルスクリプトやインタプリタ型言語でエンジンを実行したい方へ](https://github.com/sunfish-shogi/electron-shogi/wiki/%E3%82%B7%E3%82%A7%E3%83%AB%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%97%E3%83%88%E3%82%84%E3%82%A4%E3%83%B3%E3%82%BF%E3%83%97%E3%83%AA%E3%82%BF%E5%9E%8B%E8%A8%80%E8%AA%9E%E3%81%A7%E3%82%A8%E3%83%B3%E3%82%B8%E3%83%B3%E3%82%92%E5%AE%9F%E8%A1%8C%E3%81%97%E3%81%9F%E3%81%84%E6%96%B9%E3%81%B8) を参考にしてください。

## 要望・提案・不具合報告 (Feature Requests/Suggestions/Bug Reports)

GitHub のアカウントをお持ちの方は Issue/PullRequest を活用してください。
設計に関する意見も歓迎です。
軽微ではない Pull Request を作成する場合は必ず実装前にIssueでご相談ください。作業が競合したり設計方針を合意できないと、せっかく実装いただいた内容を取り込めない場合があります。

If you have a GitHub account, please create Issue or Pull Request.

GitHub アカウントをお持ちでない場合は [送信フォーム](https://form.run/@sunfish-shogi-1650819491) でご連絡ください。

If not, please send message from [Web Form](https://form.run/@sunfish-shogi-1650819491).

開発の進捗状況は [プロジェクトボード](https://github.com/users/sunfish-shogi/projects/1/views/1) を参照してください。

You can see the development progress at [Project Board](https://github.com/users/sunfish-shogi/projects/1/views/1).

## 開発 (Development)

### 必要なもの (Requirements)

- Node.js

### Setup

```
git clone https://github.com/sunfish-shogi/electron-shogi.git
cd electron-shogi
npm install
```

### Launch

```
# Electron App
npm run electron:serve

# Web App
npm run serve
```

### Release Build

```
# Electron App
npm run electron:build

# Web App
npm run build
```

### Unit Tests

```
npm run test:unit
```

カバレッジレポートを出力する場合は `-- --coverage` を付与すると `coverage` ディレクトリに結果が出力されます。

Appending `-- --coverage` option, you can see coverage report at `coverage` directory.

### Lint

```
npm run lint
```

## Licences

### Electron Shogi

[MIT License](LICENSE)

### Icon Images

[/public/icon](https://github.com/sunfish-shogi/electron-shogi/tree/main/public/icon) 配下のアイコン画像は [Material Icons](https://google.github.io/material-design-icons/) を使用しています。
これには [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt) が適用されます。

We use [Material Icons](https://google.github.io/material-design-icons/) saved in [/public/icon](https://github.com/sunfish-shogi/electron-shogi/tree/main/public/icon).
These assets are provided under [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt).

### Dependencies

レンダラープロセスで使用しているライブラリは [THIRD PARTY LICENSES](https://sunfish-shogi.github.io/electron-shogi/third-party-licenses.html) を参照してください。

See [THIRD PARTY LICENSES](https://sunfish-shogi.github.io/electron-shogi/third-party-licenses.html) for libraries used from renderer process.

Electron と Chromium については electron-builder によって成果物にバンドルされます。

electron-builder bundles license files of Electron and Chromium into artifacts.
