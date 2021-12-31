const path = require('path');

module.exports = {
  entry: {
    main: "./dist/website/hydra.js",
  },
  output: {
    path: path.join(__dirname, 'web-bundles'),
    filename: 'hydra.js',
  },
};