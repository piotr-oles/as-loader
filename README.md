<div align="center">

<img width="100" height="100" src="media/assemblyscript-logo.svg" alt="AssemblyScript logo">
<img width="100" height="100" src="media/webpack-logo.svg" alt="webpack logo">

<h1>as-loader</h1>
<p>AssemblyScript loader for webpack</p>

[![npm version](https://img.shields.io/npm/v/as-loader.svg)](https://www.npmjs.com/package/as-loader)
[![build status](https://github.com/piotr-oles/as-loader/workflows/CI/CD/badge.svg?branch=main&event=push)](https://github.com/piotr-oles/as-loader/actions?query=branch%3Amain+event%3Apush)

</div>

## Installation

This loader requires [AssemblyScript ~0.18](https://github.com/AssemblyScript/assemblyscript), 
Node.js >= 12 and [webpack 5](https://github.com/webpack/webpack)

```sh
# with npm
npm install as-loader
npm install --save-dev assemblyscript

# with yarn
yarn add as-loader
yarn add --dev assemblyscript
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

## Example repository

https://stackblitz.com/edit/webpack-webpack-js-org-zl6ung?file=webpack.config.js

## Usage

By default, the loader emits a `.wasm` file (+ `.wasm.map` if source maps are enabled) and 
creates CommonJS module that exports URL to the emitted `.wasm` file.

If you enable `fallback` option, the loader will emit additional `.js` file (+ `.js.map` if source maps are enabled)
and will expose async `fallback()` function which dynamically imports fallback module.

To simplify loading logic, you can use `as-loader/runtime` loader which uses 
[@assemblyscript/loader](https://github.com/AssemblyScript/assemblyscript/tree/master/lib/loader), or
`as-loader/runtime/bind` loader which uses [as-bind](https://github.com/torch2424/as-bind).
These loaders provide correct types, checks for WebAssembly support, and uses fallback if available.

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

### API
> For more details, check [src/runtime](src/runtime) directory

#### `as-loader/runtime`
This runtime loader uses [@assemblyscript/loader](https://github.com/AssemblyScript/assemblyscript/tree/master/lib/loader) under the hood.
```typescript
export interface WasmModuleInstance<TModule> {
  type: "wasm";
  exports: AsLoaderRuntime & PointerCastObject<TModule>;
  module: WebAssembly.Module;
  instance: WebAssembly.Instance;
}

export interface JsModuleInstance<TModule> {
  type: "js";
  exports: TModule;
}

export type ModuleInstance<TModule> =
  | WasmModuleInstance<TModule>
  | JsModuleInstance<TModule>;

export function instantiate<TModule>(
  module: TModule,
  load: (url: string) => Promise<unknown>,
  imports?: object,
  fallback: boolean = false,
  supports?: () => boolean
): Promise<ModuleInstance<TModule>>
```

<details>
<summary><code>as-loader/runtime</code> binding code example:</summary>

```typescript
// ./src/assembly/sayHello.ts
export function sayHello(firstName: string, lastName: string): string {
  return `Hello ${firstName} ${lastName}!`;
}

// ./src/sayHello.ts
import * as sayHelloModule from "./assembly/sayHello";
import { instantiate } from "as-loader/runtime";

export async function loadModule(): Promise<typeof sayHelloModule> {
  const { exports } = await instantiate(sayHelloModule, fetch);
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


#### `as-loader/runtime/bind`
This runtime loader uses [as-bind](https://github.com/torch2424/as-bind) under the hood. 
Requires `bind` option enabled in the webpack loader configuration.
> Keep in mind that currently [it's recommended to manually set `Function.returnType`](https://github.com/torch2424/as-bind#production)
```typescript
export interface BoundWasmModuleInstance<TModule, TImports> {
  type: "wasm-bound";
  exports: AsLoaderRuntime & BoundExports<TModule>;
  unboundExports: AsLoaderRuntime & PointerCastObject<TModule>;
  importObject: TImports;
  module: WebAssembly.Module;
  instance: WebAssembly.Instance;
}

export interface JsModuleInstance<TModule> {
  type: "js";
  exports: TModule;
}

type BoundModuleInstance<TModule, TImports> =
  | BoundWasmModuleInstance<TModule, TImports>
  | JsModuleInstance<TModule>;

export function instantiate<TModule, TImports>(
  module: TModule,
  load: (url: string) => Promise<unknown>,
  imports?: TImports,
  fallback: boolean = false,
  supports?: () => boolean
): Promise<BoundModuleInstance<TModule, TImports>>
```

<details>
<summary><code>as-loader/runtime/bind</code> binding code example:</summary>

```typescript
// ./src/assembly/sayHello.ts
export function sayHello(firstName: string, lastName: string): string {
  return `Hello ${firstName} ${lastName}!`;
}

// ./src/sayHello.ts
import * as sayHelloModule from "./assembly/sayHello";
import { instantiate } from "as-loader/runtime/bind";

export async function loadModule(): Promise<typeof sayHelloModule> {
  const module = await instantiate(sayHelloModule, fetch);

  return { sayHello: module.exports.sayHello };
}
```

</details>

## Binding
There are 2 aspects that you have to consider when interacting with a WebAssembly module:
  1. WebAssembly doesn't support function arguments and returns others than `number | boolean | bigint` yet.
     Because of that, you have to [manually translate between WebAssembly pointers and JavaScript objects](https://www.assemblyscript.org/loader.html#usage).
     
     The alternative is to enable the `bind` option and use `as-loader/runtime/bind` loader which uses an [as-bind](https://github.com/torch2424/as-bind) library. 
     This simplifies passing types like strings and arrays. 
       
  2. WebAssembly doesn't provide Garbage Collector yet ([proposal](https://github.com/WebAssembly/gc)) - to manage memory, 
     AssemblyScript offers very lightweight GC implementation. If you use it (see `runtime` option), 
     you have to [manually `__pin` and `__unpin` pointers](https://www.assemblyscript.org/garbage-collection.html#incremental-runtime)
     to instruct GC if given data can be collected or not.
   
## Fallback
If you need to support [older browsers](https://caniuse.com/wasm) like *Internet Explorer* or *Edge* < 16, 
you can use the `fallback` option. A fallback module is different from WebAssembly one because you don't have to bind it.


<details>
<summary>Fallback example:</summary>

```js
// webpack.config.js
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
        use: [
          // fallback loader (must be before as-loader)
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true
            }   
          },   
          // as-loader, apart from building .wasm file,
          // will forward assembly script files to the fallback loader above
          // to build a .js file
          {
            loader: "as-loader",
            options: {
              fallback: true
           }
          }
        ]
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
```typescript
// ./src/assembly/sayHello.ts
export function sayHello(firstName: string, lastName: string): string {
  return `Hello ${firstName} ${lastName}!`;
}

// ./src/sayHello.ts
import * as sayHelloModule from "./assembly/sayHello";
import { instantiate } from "as-loader/runtime";

export async function loadModule(): Promise<typeof sayHelloModule> {
  // set fallback option to true (opt-in)
  const module = await instantiate(sayHelloModule, fetch, undefined, true);

  if (module.type === 'wasm') {
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
  } else {
    return { sayHello: module.exports.sayHello }
  }
}
```

</details>
   
## Options
#### Loader Options

| Name       | Type    | Description |
|------------|---------| ----------- |
| `name`     | string  | Output asset name template, `[name].[contenthash].wasm` by default. |
| `bind`     | boolean | If true, adds [as-bind](https://github.com/torch2424/as-bind) library files to the compilation (required if you want to use `as-loader/runtime/bind`). |
| `fallback` | boolean | If true, creates additional JavaScript file which can be used if WebAssembly is not supported. |
| `raw`      | boolean | If true, returns binary instead of emitting file. Use for chaining with other loaders. |

#### Compiler Options

Options passed to the [AssemblyScript compiler](https://www.assemblyscript.org/compiler.html#command-line-options).

| Name             | Type     | Description |
|------------------|----------| ----------- |
| `debug`          | boolean  | Enables debug information in emitted binaries, enabled by default in webpack development mode. |
| `optimizeLevel`  | number   | How much to focus on optimizing code, 3 by default. [0-3] |
| `shrinkLevel`    | number   | How much to focus on shrinking code size, 1 by default. [0-2] |
| `coverage`       | boolean  | Re-optimizes until no further improvements can be made. |
| `noAssert`       | boolean  | Replaces assertions with just their value without trapping, enabled by default in webpack production mode. |
| `importMemory`   | boolean  | Imports the memory provided as 'env.memory'. |
| `noExportMemory` | boolean  | Does not export the memory as 'memory'. |
| `initialMemory`  | number   | Sets the initial memory size in pages. |
| `maximumMemory`  | number   | Sets the maximum memory size in pages. |
| `sharedMemory`   | boolean  | Declare memory as shared. Requires maximumMemory. |
| `importTable`    | boolean  | Imports the function table provided as 'env.table'. |
| `exportTable`    | boolean  | Exports the function table as 'table'. |
| `runtime`        | string   | Specifies the runtime variant to include in the program. Available runtime are: "incremental" (default), "minimal", "stub" |
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
