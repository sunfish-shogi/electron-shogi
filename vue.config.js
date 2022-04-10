module.exports = {
  pages: {
    index: {
      entry: "src/main.ts",
      title: `Electron将棋 Version ${process.env.npm_package_version}`,
    },
  },
  outputDir: "docs/webapp",
  publicPath: "./",
  pluginOptions: {
    electronBuilder: {
      preload: "src/ipc/preload.ts",
      builderOptions: {
        productName: "ElectronShogi",
      },
    },
  },
};
