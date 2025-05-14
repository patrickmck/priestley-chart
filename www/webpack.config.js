const path = require('path');

module.exports = {
  entry: {
      pchart: './js/pchart.js',
  },
  output: {
      path: path.resolve(__dirname, 'public/dist'),
      filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images/',
              name: '[name][hash].[ext]',
            },
          },
        ],
      }
    ],
  },
  devServer: {
    watchFiles: ['js/**/*.js', 'public/**/*'],
    liveReload: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
  },
};