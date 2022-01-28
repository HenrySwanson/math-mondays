const path = require('path');

module.exports = {
  entry: {
    hydra: "./dist/website/hydra.js",
    circular_prison: "./dist/website/circular_prison.js"
  },
  output: {
    path: path.join(__dirname, 'web-bundles'),
    filename: '[name].js',
  },
};