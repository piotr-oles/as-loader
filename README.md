<div align="center">

<h1>as-loader</h1>
<p>AssemblyScript loader for webpack</p>

</div>

## Installation

This loader requires minimum Node.js 8 and webpack 4

```sh
# with npm
npm install --save-dev as-loader

# with yarn
yarn add --dev as-loader
```

The minimal webpack config:

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
          // emits WASM Buffer as a .wasm file
          // and returns CJS module with an URL to that file
          {
            loader: "file-loader",
            options: {
              name: "[path][name].wasm",
              esModule: false,
            },
          },
          // converts AssemblyScript to WASM Buffer
          "as-loader",
        ],
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

```typescript
// myModule becomes an URL to the .wasm file
// (TypeScript doesn't know that, so we can still use the import type)
import * as myModule from "./assembly/myModule";
import { instantiateStreaming } from "@assemblyscript/loader";

async function loadAndRun() {
  // load module using @assemblyscript/loader
  const module = await instantiateStreaming<typeof myModule>(
    // workaround for TypeScript
    fetch((myModule as unknown) as string)
  );
  module.exports.myFunction(100);
}

loadAndRun();
```
