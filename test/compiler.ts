import path from "path";
import webpack from "webpack";
import { createFsFromVolume, Volume } from "memfs";

function compiler(
  fixture: string,
  options: Record<string, unknown> = {},
  // eslint-disable-next-line
  config: any = {}
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
          loader: path.resolve(__dirname, "../lib/index.js"),
          options: {
            name: "[name].wasm",
          },
          ...(options || {}),
        },
        {
          test: /\.ts$/,
          exclude: [path.resolve(__dirname, "./fixtures/assembly")],
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
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

  const isWebpack5 = webpack.version?.startsWith("5");

  return new Promise<webpack.Stats>((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        reject(error);
      } else if (stats?.hasErrors()) {
        reject(
          // eslint-disable-next-line
          stats?.toJson().errors?.map((error: any) => {
            if (isWebpack5) {
              // TODO: use proper e2e tests
              return `ERROR in ${error.file || error.moduleId}\n${
                error.message
              }`;
            } else {
              return error.toString();
            }
          })
        );
      } else if (stats) {
        resolve(stats);
      } else {
        reject(new Error("Unknown error - stats are undefined."));
      }
    });
  });
}

export { compiler };
