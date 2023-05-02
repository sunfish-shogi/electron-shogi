const TerserPlugin = require("terser-webpack-plugin");

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

module.exports = [{
  mode: 'production',
  entry:'./dist/src/background/index.js',
  target: 'node',
  output: {
    filename: 'background.js',
    path: __dirname + '/dist/packed',
    libraryTarget: 'commonjs2',
  },
  externals: {
    'electron': 'electron',
    'sharp' : 'commonjs sharp',
  },
  optimization,
}, {
  mode: 'production',
  entry: './dist/src/renderer/ipc/preload.js',
  output: {
    filename: 'preload.js',
    path: __dirname + '/dist/packed',
    libraryTarget: 'commonjs',
  },
  externals: {
    'electron': 'electron',
    'sharp' : 'commonjs sharp',
  },
  optimization,
},
];
