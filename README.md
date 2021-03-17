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

This loader requires [AssemblyScript ~0.18](https://github.com/AssemblyScript/assemblyscript), 
Node.js >= 12 and [webpack 4 or webpack 5](https://github.com/webpack/webpack)

```sh
# with npm
npm install --save-dev as-loader assemblyscript

# with yarn
yarn add --dev as-loader assemblyscript
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

If you enable `fallback` option, the loader will emit additional `.js` file (+ `.js.map` if source maps are enabled)
and will expose async `fallback()` function which dynamically imports fallback module.

To simplify loading logic, you can use `as-loader/runtime` loader which uses
`@assemblyscript/loader` under the hood. 
The loader provides correct types, checks for WebAssembly support, and uses fallback if available.

```typescript
import * as myModule from "./assembly/myModule";
import { instantiate } from "as-loader/runtime";

async function loadAndRun() {
  const { exports } = await instantiate(myModule);

  exports.myFunction(100);
}

loadAndRun();
```
<details>
<summary>Alternatively, you can use exported URL directly:</summary>

```typescript
import * as myModule from "./assembly/myModule";
import { instantiate } from "@assemblyscript/loader";

async function loadAndRun() {
  const { exports } = await instantiate<typeof myModule>(
    // workaround for TypeScript
    fetch((myModule as unknown) as string)
  );

  exports.myFunction(100);
}

loadAndRun();

```

</details>

## Binding
There are 2 aspects that you have to consider when interacting with WebAssembly module:
  1. WebAssembly doesn't support function arguments and returns others than `number` and `boolean` yet.
     Because of that, you have to [manually translate between WebAssembly pointers and JavaScript objects](https://www.assemblyscript.org/loader.html#usage).
     The alternative solution is to use [`as-bind`](https://github.com/torch2424/as-bind#readme) library which 
     does this automatically for `string` and `array` types (doesn't support objects yet).
  2. WebAssembly doesn't provide GC yet ([proposal](https://github.com/WebAssembly/gc)) - to manage memory, 
     AssemblyScript offers very lightweight GC implementation. If you use it (see `runtime` option - it's `"incremental"` by default), 
     you have to manually `__pin` and `__unpin` pointers to instruct GC if given data can be collected or not.

The `as-loader/runtime` uses `@assemblyscript/loader` under the hood -
[see the docs](https://www.assemblyscript.org/loader.html) for more information.

### API
> For more detailes, check [src/runtime](src/runtime) directory
```typescript
interface WasmModuleInstance<TModule> extends ResultObject {
  type: "wasm";
  exports: AsLoaderRuntime & PointerifyObject<TModule>;
}

interface JsModuleInstance<TModule> {
  type: "js";
  exports: TModule;
}

type ModuleInstance<TModule> =
  | WasmModuleInstance<TModule>
  | JsModuleInstance<TModule>;

function instantiate<TModule>(
  module: TModule,
  load: (url: string) => Promise<unknown>,
  imports?: object,
  fallback?: boolean,
  supports?: () => boolean
): Promise<ModuleInstance<TModule>>
```

<details>
<summary>Binding code example:</summary>

```typescript
// ./src/assembly/sayHello.ts
export function sayHello(firstName: string, lastName: string): string {
  return `Hello ${firstName} ${lastName}!`;
}

// ./src/sayHello.ts
import * as sayHelloModule from "./assembly/sayHello";
import { instantiate } from "as-loader/runtime";

export async function loadModule(): Promise<typeof sayHelloModule> {
  // this example doesn't use fallback so TypeScript knows that it's only WASM module
  const { exports } = await instantiate(sayHelloModule, fetch, undefined, false);
  const { __pin, __unpin, __newString, __getString } = exports;

  function sayHello(firstName: string, lastName: string): string {
    const firstNamePtr = __pin(__newString(firstName));
    const lastNamePtr = __pin(__newString(lastName));
    const result = __getString(
      exports.sayHello(firstNamePtr, lastNamePtr)
    );

    __unpin(firstNamePtr);
    __unpin(lastNamePtr);

    return result;
  }

  return { sayHello };
}
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
| `debug`          | boolean  | Enables debug information in emitted binaries. |
| `optimizeLevel`  | number   | How much to focus on optimizing code. [0-3] |
| `shrinkLevel`    | number   | How much to focus on shrinking code size. [0-2] |
| `coverage`       | boolean  | Re-optimizes until no further improvements can be made. |
| `noAssert`       | boolean  | Replaces assertions with just their value without trapping. |
| `importMemory`   | boolean  | Imports the memory provided as 'env.memory'. |
| `noExportMemory` | boolean  | Does not export the memory as 'memory'. |
| `initialMemory`  | number   | Sets the initial memory size in pages. |
| `maximumMemory`  | number   | Sets the maximum memory size in pages. |
| `sharedMemory`   | boolean  | Declare memory as shared. Requires maximumMemory. |
| `importTable`    | boolean  | Imports the function table provided as 'env.table'. |
| `exportTable`    | boolean  | Exports the function table as 'table'. |
| `runtime`        | string   | Specifies the runtime variant to include in the program. Available runtimes are: "incremental" (default), "minimal", "stub" |
| `exportRuntime`  | boolean  | Exports the runtime helpers (__new, __collect etc.). Enabled by default. |
| `explicitStart`  | boolean  | Exports an explicit '_start' function to call. |
| `enable`         | string[] | Enables WebAssembly features being disabled by default. Available features are: "sign-extension", "bulk-memory", "simd", "threads", "reference-types", "gc" |
| `disable`        | string[] | Disables WebAssembly features being enabled by default. Available features are: "mutable-globals" |
| `lowMemoryLimit` | boolean  | Enforces very low (<64k) memory constraints. |
| `memoryBase`     | number   | Sets the start offset of emitted memory segments. |
| `tableBase`      | number   | Sets the start offset of emitted table elements. |
| `trapMode`       | string   | Sets the trap mode to use. Available modes are: "allow", "clamp", "js" |
| `noValidate`     | boolean  | Skips validating the module using Binaryen. |

## License

MIT
