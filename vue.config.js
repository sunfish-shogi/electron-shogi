module.exports = {
  outputDir: "docs/webapp",
  publicPath: "./",
  pluginOptions: {
    // NOTICE:
    //   Do NOT set nodeIntegration with true.
    //   nodeIntegration を true に設定しないでください。
    //   See https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
    nodeIntegration: false,
    electronBuilder: {
      preload: "src/ipc/preload.ts",
      builderOptions: {
        productName: "ElectronShogi",
      },
    },
  },
};
