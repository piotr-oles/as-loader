import { compiler } from "./compiler";
import webpack from "webpack";

jest.setTimeout(30000);

describe("as-loader", () => {
  it("works without options", async () => {
    const stats = await compiler("correct.ts");

    expect(Object.keys(stats.compilation.assets)).toEqual([
      "simple.wasm",
      "main.js",
    ]);
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });

  it("generates source maps", async () => {
    const stats = await compiler("correct.ts", {}, { devtool: "source-map" });

    expect(Object.keys(stats.compilation.assets)).toEqual([
      "simple.wasm",
      "simple.wasm.map",
      "main.js",
      "main.js.map",
    ]);
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });

  it("reports errors in project", async () => {
    let errors;
    try {
      await compiler("broken.ts");
    } catch (error) {
      errors = error;
    }
    expect(errors).not.toBeUndefined();
    expect(errors).toHaveLength(4);
    expect(errors[0]).toContain("./assembly/broken/simple.ts");
    expect(errors[0]).toContain(
      "AssemblyScriptError: Compilation failed - found 3 errors."
    );
    expect(errors[1]).toContain("./assembly/broken/simple.ts 4:14-15");
    expect(errors[1]).toContain(
      "Type 'i32' is not assignable to type '~lib/string/String'."
    );
    expect(errors[2]).toContain("./assembly/broken/shared.ts 2:14-15");
    expect(errors[2]).toContain(
      "Type 'i32' is not assignable to type '~lib/string/String'."
    );
    expect(errors[3]).toContain("./assembly/broken/shared.ts 2:10-15");
    expect(errors[3]).toContain(
      "Type '~lib/string/String' is not assignable to type 'i32'."
    );
  });

  it("loads using webassembly/sync type", async () => {
    if (!webpack.version?.startsWith("5")) {
      console.log(
        `skipping test for webpack v${webpack.version} - requires min v5.0.0`
      );
      return;
    }
    const stats = await compiler(
      "async.ts",
      { type: "webassembly/sync" },
      { devtool: "source-map", experiments: { syncWebAssembly: true } }
    );

    expect(Object.keys(stats.compilation.assets)).toEqual(
      expect.arrayContaining([
        "main.js",
        "main.js.map",
        "assembly_correct_simple_ts.js",
        expect.stringMatching(/.*\.wasm/),
      ])
    );
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });

  it("loads using webassembly/async type", async () => {
    if (!webpack.version?.startsWith("5")) {
      console.log(
        `skipping test for webpack v${webpack.version} - requires min v5.0.0`
      );
      return;
    }
    const stats = await compiler(
      "async.ts",
      { type: "webassembly/async" },
      { devtool: "source-map", experiments: { asyncWebAssembly: true } }
    );

    expect(Object.keys(stats.compilation.assets)).toEqual(
      expect.arrayContaining([
        "main.js",
        "main.js.map",
        "assembly_correct_simple_ts.js",
        expect.stringMatching(/.*\.wasm/),
      ])
    );
    expect(stats.compilation.warnings).toHaveLength(0);
    expect(stats.compilation.errors).toHaveLength(0);
  });
});
