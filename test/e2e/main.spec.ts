import * as path from "path";
import {
  createSandbox,
  Sandbox,
  packLocalPackage,
  createProcessDriver,
} from "karton";
import { instantiate } from "@assemblyscript/loader/umd";

jest.setTimeout(120000);

describe("as-loader", () => {
  let sandbox: Sandbox;

  beforeAll(async () => {
    sandbox = await createSandbox({
      lockDirectory: path.resolve(__dirname, "__locks__"),
      fixedDependencies: {
        "as-loader": `file:${await packLocalPackage(
          path.resolve(__dirname, "../../")
        )}`,
      },
    });
  });
  afterEach(async () => {
    await sandbox.reset();
  });
  afterAll(async () => {
    await sandbox.cleanup();
  });

  describe("single compilation", () => {
    it("works without options", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      const webpackResults = await sandbox.exec("yarn webpack");

      expect(webpackResults).toContain("simple.wasm");
      expect(webpackResults).toContain("simple.wasm.map");
      expect(webpackResults).toContain("main.js");

      const simpleWasmInstance = await instantiate<
        typeof import("./fixtures/main/src/assembly/correct/simple")
      >(await sandbox.read("dist/simple.wasm"));

      expect(simpleWasmInstance.exports.run()).toEqual(15);

      const simpleWasmMap = await sandbox.read("dist/simple.wasm.map", "utf8");
      expect(Object.keys(JSON.parse(simpleWasmMap))).toEqual(
        expect.arrayContaining(["version", "sources", "names", "mappings"])
      );

      const mainResults = await sandbox.exec("node ./dist/main.js");
      expect(mainResults).toEqual("15\n");
    });

    it("reports errors in project", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        'entry: "./src/correct.ts",',
        'entry: "./src/broken.ts",'
      );

      const results = await sandbox.exec("yarn webpack", { fail: true });

      expect(results).toContain(
        [
          "ERROR in ./src/assembly/broken/simple.ts",
          "Module build failed (from ./node_modules/as-loader/loader/index.js):",
          "AssemblyScriptError: Compilation failed - found 3 errors.",
        ].join("\n")
      );
      expect(results).toContain(
        [
          "ERROR in ./src/assembly/broken/simple.ts 4:14-15",
          "Type 'i32' is not assignable to type '~lib/string/String'.",
        ].join("\n")
      );
      expect(results).toContain(
        [
          "ERROR in ./src/assembly/broken/shared.ts 2:14-15",
          "Type 'i32' is not assignable to type '~lib/string/String'.",
        ].join("\n")
      );
      expect(results).toContain(
        [
          "ERROR in ./src/assembly/broken/shared.ts 2:10-15",
          "Type '~lib/string/String' is not assignable to type 'i32'.",
        ].join("\n")
      );
    });

    it.each([
      ["webassembly/sync", "syncWebAssembly"],
      ["webassembly/async", "asyncWebAssembly"],
    ])("loads using %s type", async (type, experiment) => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        'entry: "./src/correct.ts",',
        'entry: "./src/async.ts",'
      );
      await sandbox.patch(
        "webpack.config.js",
        '        loader: "as-loader",',
        ['        loader: "as-loader",', `        type: "${type}",`].join("\n")
      );
      await sandbox.patch(
        "webpack.config.js",
        '  mode: "development",',
        [
          '  mode: "development",',
          "  experiments: {",
          `    ${experiment}: true,`,
          "  },",
        ].join("\n")
      );

      const webpackResults = await sandbox.exec("yarn webpack");

      expect(webpackResults).toContain("main.js");
      expect(webpackResults).toContain(".wasm");

      const distDirents = await sandbox.list("dist");
      const simpleWasmDirent = distDirents.find(
        (dirent) => dirent.isFile() && dirent.name.endsWith(".wasm")
      );
      expect(simpleWasmDirent).toBeDefined();

      const simpleWasmInstance = await instantiate<
        typeof import("./fixtures/main/src/assembly/correct/simple")
      >(await sandbox.read(`dist/${simpleWasmDirent?.name}`));

      expect(simpleWasmInstance.exports.run()).toEqual(15);

      const mainResults = await sandbox.exec("node ./dist/main.js");
      expect(mainResults).toEqual("15\n");
    });

    it("creates js file for fallback option", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        '  entry: "./src/correct.ts",',
        '  entry: "./src/fallback.ts",'
      );
      await sandbox.patch(
        "webpack.config.js",
        [
          '        loader: "as-loader",',
          "        options: {",
          '          name: "[name].wasm",',
          "        },",
        ].join("\n"),
        [
          "        use: [",
          "          {",
          '            loader: "ts-loader",',
          "            options: {",
          "              transpileOnly: true,",
          "            }",
          "          },",
          "          {",
          '            loader: "as-loader",',
          "            options: {",
          '              name: "[name].wasm",',
          "              fallback: true,",
          "            },",
          "          },",
          "        ],",
        ].join("\n")
      );

      const webpackResults = await sandbox.exec("yarn webpack");

      expect(webpackResults).toContain("complex.js");
      expect(webpackResults).toContain("complex.wasm");
      expect(webpackResults).toContain("complex.wasm.map");
      expect(webpackResults).toContain("main.js");

      expect(await sandbox.exists("dist/complex.js")).toEqual(true);
      expect(await sandbox.exists("dist/complex.wasm")).toEqual(true);
      expect(await sandbox.exists("dist/complex.js.map")).toEqual(true);
      expect(await sandbox.exists("dist/complex.wasm.map")).toEqual(true);

      const simpleJsMap = await sandbox.read("dist/complex.js.map", "utf8");
      expect(Object.keys(JSON.parse(simpleJsMap))).toEqual(
        expect.arrayContaining(["version", "sources", "names", "mappings"])
      );

      const mainResults = await sandbox.exec("node ./dist/main.js");
      expect(mainResults).toEqual(
        "rgb(100, 50, 20),rgb(105, 51, 19),rgb(110, 52, 18),rgb(115, 53, 17),rgb(120, 54, 16),rgb(125, 55, 15),rgb(130, 56, 14),rgb(135, 57, 13),rgb(140, 58, 12),rgb(145, 59, 11)\n"
      );
    });

    it("sets correct [contenthash]", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        '          name: "[name].wasm",',
        '          name: "[name].[contenthash].wasm",'
      );

      const webpackResults = await sandbox.exec("yarn webpack");

      const simpleWasmFileName = path.join(
        "dist",
        (await sandbox.list("dist")).find((dirent) =>
          dirent.name.endsWith(".wasm")
        )?.name
      );
      const simpleWasmSourceMapFileName = path.join(
        "dist",
        (await sandbox.list("dist")).find((dirent) =>
          dirent.name.endsWith(".wasm.map")
        )?.name
      );

      expect(simpleWasmFileName).toMatch(/simple\.[0-9a-f]+\.wasm$/);
      expect(simpleWasmSourceMapFileName).toMatch(
        /simple\.[0-9a-f]+\.wasm\.map$/
      );

      expect(webpackResults).toContain(path.basename(simpleWasmFileName));
      expect(webpackResults).toContain(
        path.basename(simpleWasmSourceMapFileName)
      );

      const mainResults = await sandbox.exec("node ./dist/main.js");
      expect(mainResults).toEqual("15\n");
    });

    it("compiles example with context data types", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        '  entry: "./src/correct.ts",',
        '  entry: "./src/complex.ts",'
      );

      const webpackResults = await sandbox.exec("yarn webpack");

      expect(webpackResults).toContain("complex.wasm");
      expect(webpackResults).toContain("complex.wasm.map");
      expect(webpackResults).toContain("main.js");

      const mainResults = await sandbox.exec("node ./dist/main.js");
      expect(mainResults).toEqual(
        "rgb(100, 50, 20),rgb(105, 51, 19),rgb(110, 52, 18),rgb(115, 53, 17),rgb(120, 54, 16),rgb(125, 55, 15),rgb(130, 56, 14),rgb(135, 57, 13),rgb(140, 58, 12),rgb(145, 59, 11)\n"
      );
    });

    it("compiles example with bind", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        '  entry: "./src/correct.ts",',
        '  entry: "./src/bind.ts",'
      );
      await sandbox.patch(
        "webpack.config.js",
        '          name: "[name].wasm",',
        ['          name: "[name].wasm",', "          bind: true,"].join("\n")
      );

      const webpackResults = await sandbox.exec("yarn webpack");

      expect(webpackResults).toContain("bind.wasm");
      expect(webpackResults).toContain("bind.wasm.map");
      expect(webpackResults).toContain("main.js");

      const mainResults = await sandbox.exec("node ./dist/main.js");
      expect(mainResults).toEqual("Hello world!\n");
    });
  });

  describe("watch compilation", () => {
    it("re-compiles wasm file on change with", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      const webpack = createProcessDriver(
        await sandbox.spawn("yarn webpack --watch")
      );

      await webpack.waitForStdoutIncludes(["simple.wasm ", "simple.wasm.map "]);

      expect(await sandbox.exists("dist/simple.wasm")).toBe(true);
      expect(await sandbox.exists("dist/simple.wasm.map")).toBe(true);

      // update assembly script file
      await sandbox.patch("src/assembly/correct/shared.ts", "a + b", "a - b");

      await webpack.waitForStdoutIncludes(["simple.wasm ", "simple.wasm.map "]);

      const simpleWasmInstance = await instantiate<
        typeof import("./fixtures/main/src/assembly/correct/simple")
      >(await sandbox.read(`dist/simple.wasm`));

      expect(simpleWasmInstance.exports.run()).toEqual(-5);
    });

    it("reports errors on change", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      const webpack = createProcessDriver(
        await sandbox.spawn("yarn webpack --watch")
      );

      await webpack.waitForStdoutIncludes("simple.wasm ");

      // update assembly script file
      await sandbox.patch(
        "src/assembly/correct/shared.ts",
        "a: i32",
        "a: string"
      );

      await webpack.waitForStdoutIncludes([
        "AssemblyScriptError: Compilation failed - found 3 errors.",
        [
          "ERROR in ./src/assembly/correct/simple.ts 4:14-15",
          "Type 'i32' is not assignable to type '~lib/string/String'.",
        ].join("\n"),
        [
          "ERROR in ./src/assembly/correct/shared.ts 2:14-15",
          "Type 'i32' is not assignable to type '~lib/string/String'.",
        ].join("\n"),
        [
          "ERROR in ./src/assembly/correct/shared.ts 2:10-15",
          "Type '~lib/string/String' is not assignable to type 'i32'.",
        ].join("\n"),
      ]);

      await sandbox.patch("src/assembly/correct/shared.ts", "a + b", "a - b");

      await webpack.waitForStdoutIncludes(
        "AssemblyScriptError: Compilation failed - found 2 errors."
      );

      await sandbox.patch(
        "src/assembly/correct/shared.ts",
        "a: string",
        "a: i32"
      );

      await webpack.waitForStdoutIncludes("simple.wasm ");

      const simpleWasm = await sandbox.read(`dist/simple.wasm`);
      const simpleWasmInstance = await instantiate<
        typeof import("./fixtures/main/src/assembly/correct/simple")
      >(simpleWasm);

      expect(simpleWasmInstance.exports.run()).toEqual(-5);
    });
  });

  describe("options", () => {
    it("passes options to assemblyscript compiler", async () => {
      await sandbox.load(path.resolve(__dirname, "fixtures/main"));
      await sandbox.install("yarn", {});

      await sandbox.patch(
        "webpack.config.js",
        '          name: "[name].wasm",',
        [
          '          name: "[name].wasm",',
          "          optimizeLevel: 2,",
          "          shrinkLevel: 1,",
          "          coverage: true,",
          "          noAssert: true,",
          '          runtime: "minimal",',
          "          debug: true,",
          '          trapMode: "allow",',
          "          noValidate: true,",
          "          importMemory: false,",
          "          noExportMemory: true,",
          "          initialMemory: 5000,",
          "          maximumMemory: 10000,",
          "          sharedMemory: false,",
          "          importTable: false,",
          "          exportTable: false,",
          "          explicitStart: false,",
          '          enable: ["simd", "threads"],',
          '          disable: ["mutable-globals"],',
          "          lowMemoryLimit: false,",
        ].join("\n")
      );

      const results = await sandbox.exec("yarn webpack");
      expect(results).toContain("simple.wasm");
      expect(results).toContain("simple.wasm.map");
      expect(results).toContain("main.js");

      const simpleWasmInstance = await instantiate<
        typeof import("./fixtures/main/src/assembly/correct/simple")
      >(await sandbox.read("dist/simple.wasm"));

      expect(simpleWasmInstance.exports.run()).toEqual(15);

      const simpleWasmMap = await sandbox.read("dist/simple.wasm.map", "utf8");
      expect(Object.keys(JSON.parse(simpleWasmMap))).toEqual(
        expect.arrayContaining(["version", "sources", "names", "mappings"])
      );
    });
  });
});
