import path from "path";
import webpack from "webpack";
import { createFsFromVolume, Volume } from "memfs";

/**
 * @param {string} fixture
 * @param {object} options
 * @param {object} config
 * @returns {Promise<webpack.Stats>}
 */
function compiler(
  fixture: string,
  options: Record<string, unknown> = {},
  config: webpack.Configuration = {}
) {
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
              loader: path.resolve(__dirname, "../lib/index.js"),
              options: {
                name: "[name].wasm",
                ...(options || {}),
              },
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

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  compiler.outputFileSystem = createFsFromVolume(new Volume());
  compiler.outputFileSystem.join = path.join.bind(path);

  return new Promise<webpack.Stats>((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(error);
      } else if (stats.hasErrors()) {
        reject(stats.toJson().errors.map((error) => error.toString()));
      } else {
        resolve(stats);
      }
    });
  });
}

export { compiler };
