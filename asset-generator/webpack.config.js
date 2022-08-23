const path = require('path');
const glob = require("glob");

// This contains the js files that were compiled by TS
const ASSET_DIR = "./dist/assets";

module.exports = {
  entry: () => {
    // Find all .webpack.js files
    let files = glob.sync(ASSET_DIR + "/**/*.webpack.js");
    let entries = {};

    for (let file of files) {
      // Get the "core" of the path, i.e. all the stuff that isn't specified
      // in the glob.
      let core = file.slice(ASSET_DIR.length + 1).replace(/\.webpack\.js/, "");

      let entry_name = core.split("/").join("_");
      let entry = {
        import: file,
        filename: core + ".js"
      };

      entries[entry_name] = entry;
    }

    return entries;
  },
  output: {
    path: path.join(__dirname, 'web-bundles'),
  },
  optimization: {
    // Uncomment to un-minify the output JS
    minimize: false
  },
};