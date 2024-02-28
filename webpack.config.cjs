const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");
const customPlugins = require("./plugins/webpack");

const optimization = {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      terserOptions: {
        format: {
          comments: false,
        },
      },
      extractComments: false,
    }),
  ],
};

module.exports = [
  {
    name: "background",
    mode: "production",
    entry: "./dist/src/background/index.js",
    target: "node",
    output: {
      filename: "background.js",
      path: __dirname + "/dist/packed",
      libraryTarget: "commonjs2",
    },
    externals: ["electron"],
    optimization,
  },
  {
    name: "preload",
    mode: "production",
    entry: "./dist/src/renderer/ipc/preload.js",
    output: {
      filename: "preload.js",
      path: __dirname + "/dist/packed",
      libraryTarget: "commonjs",
    },
    externals: ["electron"],
    optimization,
  },
  {
    name: "command:usi-csa-bridge",
    mode: "production",
    entry: "./dist/src/command/usi-csa-bridge/index.js",
    target: "node",
    output: {
      filename: "index.js",
      path: __dirname + "/dist/command/usi-csa-bridge",
      libraryTarget: "commonjs2",
    },
    externals: ["electron"],
    optimization,
    plugins: [
      new webpack.BannerPlugin({ banner: "#!/usr/bin/env node", raw: true }),
      customPlugins.AddExecPermission,
    ],
  },
];
