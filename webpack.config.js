module.exports = {
  module: {
    rules: [
      {
        test: /\.worker\.js$/,
        loader: 'worker-loader',
      },
    ],
  },
}
