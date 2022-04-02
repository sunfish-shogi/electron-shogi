module.exports = {
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
