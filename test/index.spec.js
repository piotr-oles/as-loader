const path = require("path");
const compiler = require("./compiler");

jest.setTimeout(30000);

describe("as-loader", () => {
  it("works without options", async () => {
    const stats = await compiler("index.ts");

    expect(Object.keys(stats.compilation.assets)).toEqual([
      "simple.wasm",
      "main.js",
    ]);
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });

  it.skip("generates source maps", async () => {
    // TODO: make it work
    const stats = await compiler("index.ts", {}, { devtool: "source-map" });

    expect(Object.keys(stats.compilation.assets)).toEqual([
      "simple.wasm",
      "simple.wasm.map",
      "main.js",
      "main.js.map",
    ]);
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });

  it("works with thread-loader", async () => {
    const stats = await compiler(
      "index.ts",
      {},
      {
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
                "thread-loader",
                {
                  loader: path.resolve(__dirname, "../index.js"),
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
      }
    );

    expect(Object.keys(stats.compilation.assets)).toEqual([
      "simple.wasm",
      "main.js",
    ]);
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });
});
