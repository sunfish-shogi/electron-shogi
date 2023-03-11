"use strict"

import builder from "electron-builder";
import fs from "fs";

/**
* @type {import('electron-builder').Configuration}
* @see https://www.electron.build/configuration/configuration
*/
const config = {
  productName: "ElectronShogi",
  extraMetadata: {
    main: "dist/packed/background.js"
  },
  extends: null,
  files: [
    "dist/assets",
    "dist/board",
    "dist/character",
    "dist/icon",
    "dist/piece",
    "dist/sound",
    "dist/index.html",
    "dist/packed",
    "!node_modules/**/*",
  ],
  afterPack: function(context) {
    if (context.electronPlatformName === 'darwin') {
      return;
    }
    let localeDir = context.appOutDir+'/locales/';
    for (const file of fs.readdirSync(localeDir)) {
      switch (file) {
        case "en-US.pak":
        case "ja.pak":
          break;
        default:
          fs.unlinkSync(localeDir + file);
          break;
      }
    }
  },
  win: {},
  nsis: {
    allowElevation: false,
    packElevateHelper: false,
  },
  mac: {
    electronLanguages: ["en", "ja"],
  },
};

builder.build({ config })
.then((result) => {
  console.log(JSON.stringify(result))
})
.catch((error) => {
  throw error;
})
