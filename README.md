<div align="center">

<img width="100" height="100" src="media/assemblyscript-logo.svg" alt="AssemblyScript logo">
<img width="100" height="100" src="media/webpack-logo.svg" alt="webpack logo">

<h1>as-loader</h1>
<p>AssemblyScript loader for webpack</p>
<p>⚠️ In development ⚠️</p>

[![npm version](https://img.shields.io/npm/v/as-loader.svg)](https://www.npmjs.com/package/as-loader)
[![build status](https://github.com/piotr-oles/as-loader/workflows/CI/CD/badge.svg?branch=main&event=push)](https://github.com/piotr-oles/as-loader/actions?query=branch%3Amain+event%3Apush)

</div>

## Installation

This loader requires minimum [AssemblyScript  0.18](https://github.com/AssemblyScript/assemblyscript), 
Node.js 12 and [webpack 4 or webpack 5](https://github.com/webpack/webpack)

```sh
# with npm
npm install --save-dev as-loader

# with yarn
yarn add --dev as-loader
```

The minimal `webpack.config.js`:

```js
module.exports = {
  entry: "src/index.ts",
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.resolve(__dirname, "src/assembly"),
        loader: "as-loader",
        options: {
          // optional loader and compiler options
        }
      },
      {
        test: /\.ts$/,
        exclude: path.resolve(__dirname, "src/assembly"),
        loader: "ts-loader",
      },
    ],
  },
};
```

## Usage

By default, the loader emits `.wasm` file (+ `.wasm.map` if source maps are enabled) and 
creates CommonJS module that exports URL to the emitted `.wasm` file.

If you enable `fallback` option, the loader will also emit `.js` file (+ `.js.map` if source maps are enabled)
and will expose async `fallback()` function which dynamically imports fallback module.

To simplify loading logic, you can use `as-loader/runtime/` loaders which uses
`@assemblyscript/loader` under the hood. Available loaders are: `web`, `node`.
These loaders will check for WebAssembly support, and will use fallback if available.
They will also ensure correct typings.

```typescript
import * as myModule from "./assembly/myModule";
import { instantiate } from "as-loader/runtime/web";

async function loadAndRun() {
  const myModuleInstance = await instantiate(myModule);

  myModuleInstance.exports.myFunction(100);
}

loadAndRun();
```
<details>
<summary>Alternatively, you can use exported URL directly:</summary>

```typescript
import * as myModule from "./assembly/myModule";
import { instantiate } from "@assemblyscript/loader";

async function loadAndRun() {
  const myModuleInstance = await instantiate<typeof myModule>(
    // workaround for TypeScript
    fetch((myModule as unknown) as string)
  );

  myModuleInstance.exports.myFunction(100);
}

loadAndRun();

```

</details>

## Options
#### Loader Options

| Name       | Type    | Description |
|------------|---------| ----------- |
| `name`     | string  | Output asset name template, `[name].[contenthash].wasm` by default. |
| `raw`      | boolean | If true, returns binary instead of emitting file. Use for chaining with other loaders. |
| `fallback` | boolean | If true, creates additional JavaScript file which can be used if WebAssembly is not supported. |

#### Compiler Options

Options passed to the [AssemblyScript compiler](https://www.assemblyscript.org/compiler.html#command-line-options).

| Name             | Type     | Description |
|------------------|----------| ----------- |
| `optimizeLevel`  | number   | How much to focus on optimizing code. [0-3] |
| `shrinkLevel`    | number   | How much to focus on shrinking code size. [0-2] |
| `coverage`       | boolean  | Re-optimizes until no further improvements can be made. |
| `noAssert`       | boolean  | Replaces assertions with just their value without trapping. |
| `runtime`        | string   | Specifies the runtime variant to include in the program. Available runtimes are: "full", "half", "stub", "none" |
| `debug`          | boolean  | Enables debug information in emitted binaries. |
| `trapMode`       | string   | Sets the trap mode to use. Available modes are: "allow", "clamp", "js" |
| `noValidate`     | boolean  | Skips validating the module using Binaryen. |
| `importMemory`   | boolean  | Imports the memory provided as 'env.memory'. |
| `noExportMemory` | boolean  | Does not export the memory as 'memory'. |
| `initialMemory`  | number   | Sets the initial memory size in pages. |
| `maximumMemory`  | number   | Sets the maximum memory size in pages. |
| `sharedMemory`   | boolean  | Declare memory as shared. Requires maximumMemory. |
| `importTable`    | boolean  | Imports the function table provided as 'env.table'. |
| `exportTable`    | boolean  | Exports the function table as 'table'. |
| `explicitStart`  | boolean  | Exports an explicit '_start' function to call. |
| `enable`         | string[] | Enables WebAssembly features being disabled by default. Available features are: "sign-extension", "bulk-memory", "simd", "threads", "reference-types" |
| `disable`        | string[] | Disables WebAssembly features being enabled by default. Available features are: "mutable-globals" |
| `lowMemoryLimit` | boolean  | Enforces very low (<64k) memory constraints. |
| `memoryBase`     | number   | Sets the start offset of emitted memory segments. |
| `tableBase`      | number   | Sets the start offset of emitted table elements. |

## License

MIT
