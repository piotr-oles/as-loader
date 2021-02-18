<div align="center">

<h1>as-loader</h1>
<p>AssemblyScript loader for webpack (⚠️ In development ⚠️)</p>

</div>

## Installation

This loader requires minimum AssemblyScript 0.18, Node.js 8 and webpack 4 
(webpack 5 support will be implemented soon)

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
        loader:  "as-loader",
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
// this example uses @assemblyscript/loader, but you can use
// any loader, like as-bind or WebAssembly API
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

## Options
TODO
