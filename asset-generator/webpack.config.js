const path = require('path');

module.exports = {
  entry: {
    // TODO: rename files
    hydra: "./dist/assets/hydra/hydra.js",
    circular_prison: "./dist/assets/circular_prison/circular_prison.js"
  },
  output: {
    path: path.join(__dirname, 'web-bundles'),
    filename: '[name].js',
  },
  optimization: {
    // Uncomment to un-minify the output JS
    minimize: false
	},
};