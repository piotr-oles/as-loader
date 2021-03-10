const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  context: __dirname,
  entry: "./src/correct.ts",
  target: "node",
  output: {
    path: path.resolve(__dirname, "./dist"),
    publicPath: "./dist/"
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: [path.resolve(__dirname, "src/assembly")],
        loader: "as-loader",
        options: {
          name: "[name].wasm",
        },
      },
      {
        test: /\.ts$/,
        exclude: [path.resolve(__dirname, "src/assembly")],
        loader: "ts-loader",
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
};
