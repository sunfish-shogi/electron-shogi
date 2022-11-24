// see https://github.com/electron/electron/issues/18738
exports.default = function(context) {
  var fs = require('fs');
  var localeDir = context.appOutDir+'/locales/';
  fs.readdir(localeDir, function(err, files){
    if (err) {
      throw err;
    }
    for (const file of files) {
      switch (file) {
        case "en-US.pak":
        case "ja.pak":
          break;
        default:
          fs.unlinkSync(localeDir + file);
          break;
      }
    }
  });
}
