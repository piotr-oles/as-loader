const compiler = require("./compiler");

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
    expect(errors[0]).toContain(" @ ./broken.ts 1:0-53 2:12-20");
    expect(errors[1]).toEqual(
      "./assembly/broken/simple.ts 4:14-15\n" +
        "Type 'i32' is not assignable to type '~lib/string/String'.\n" +
        " @ ./broken.ts 1:0-53 2:12-20"
    );
    expect(errors[2]).toEqual(
      "./assembly/broken/shared.ts 2:14-15\n" +
        "Type 'i32' is not assignable to type '~lib/string/String'.\n" +
        " @ ./broken.ts 1:0-53 2:12-20"
    );
    expect(errors[3]).toEqual(
      "./assembly/broken/shared.ts 2:10-15\n" +
        "Type '~lib/string/String' is not assignable to type 'i32'.\n" +
        " @ ./broken.ts 1:0-53 2:12-20"
    );
  });
});
