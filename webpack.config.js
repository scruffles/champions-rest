const webpack = require('webpack')

module.exports = {
  devtool: 'source-map',
  entry: [
    'babel-polyfill',
    './scripts/main',
  ],
  module: {
    loaders: [
      {test: /.json$/, loader: 'json-loader'},
      {test: /.jsx?$/, loader: 'babel-loader', exclude: /node_modules/}
    ],
  },
  output: {
    filename: 'bundle.js',
    path: `${__dirname}/public/`,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"',
      },
    }),
    new webpack.IgnorePlugin(/regenerator|nodent|js-beautify/, /ajv/),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      dead_code: true,
      minimize: true,
    }),
  ],
  resolve: {
    extensions: [
      '.js',
      '.json',
      '.jsx',
    ],
  },
}