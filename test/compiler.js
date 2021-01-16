const path = require("path");
const webpack = require("webpack");
const { createFsFromVolume, Volume } = require("memfs");

/**
 * @param {string} fixture
 * @param {object} options
 * @param {object} config
 * @returns {Promise<webpack.Stats>}
 */
module.exports = function compiler(fixture, options = {}, config = {}) {
  const compiler = webpack({
    mode: "development",
    devtool: config.devtool || false,
    context: path.resolve(__dirname, "./fixtures"),
    entry: path.resolve(__dirname, "./fixtures", fixture),
    output: {
      path: path.resolve(__dirname, "./outputs"),
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          include: [path.resolve(__dirname, "./fixtures/assembly")],
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].wasm",
                esModule: false,
              },
            },
            {
              loader: path.resolve(__dirname, "../index.js"),
              options: options || {},
            },
          ],
        },
        {
          test: /\.ts$/,
          exclude: [path.resolve(__dirname, "./fixtures/assembly")],
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [],
    ...config,
  });

  compiler.outputFileSystem = createFsFromVolume(new Volume());
  compiler.outputFileSystem.join = path.join.bind(path);

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) reject(err);
      if (stats.hasErrors()) reject(new Error(stats.toJson().errors));

      resolve(stats);
    });
  });
};
