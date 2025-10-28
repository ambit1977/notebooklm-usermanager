const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup.ts',
    content: './src/content.ts',
    background: './src/background.ts',
    debug: './src/debug.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist/extension'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/manifest.json',
          to: 'manifest.json'
        },
        {
          from: 'src/popup.html',
          to: 'popup.html'
        },
        {
          from: 'src/icons',
          to: 'icons',
          noErrorOnMissing: true
        },
        {
          from: 'README.md',
          to: 'README.md'
        }
      ]
    })
  ],
  optimization: {
    minimize: false // Chrome拡張機能ではminifyしない方がデバッグしやすい
  },
  devtool: 'source-map'
};
