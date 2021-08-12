/* eslint-disable @typescript-eslint/triple-slash-reference, @typescript-eslint/ban-ts-comment */
/// <reference path="./types/std.ts" />
import type { Imports } from "@assemblyscript/loader";
import * as AsBind from "as-bind";
import type {
  JsModuleInstance,
  AsLoaderModule,
  BoundModuleInstance,
  BoundWasmModuleInstance,
} from "./types";
import type {
  Pointer,
  NonPointerTypes,
  NullablePointer,
  PointerCast,
  PointerCastArray,
  PointerCastFunction,
  PointerCastInstance,
  PointerCastObject,
} from "./types/pointer";
import type { AsLoaderRuntime } from "./types/runtime";

function instantiate<
  TModule,
  TImports extends Imports | undefined = Imports | undefined
>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: TImports,
  fallback: false,
  supports?: () => boolean
): Promise<BoundWasmModuleInstance<TModule, TImports>>;
function instantiate<
  TModule,
  TImports extends Imports | undefined = Imports | undefined
>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: TImports,
  fallback?: true,
  supports?: () => boolean
): Promise<BoundModuleInstance<TModule, TImports>>;
function instantiate<
  TModule,
  TImports extends Imports | undefined = Imports | undefined
>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: TImports,
  fallback = true,
  supports = () => typeof WebAssembly === "object"
): Promise<BoundModuleInstance<TModule, TImports>> {
  if (supports()) {
    // WebAssembly is supported
    // @ts-ignore invalid as-build typings
    return AsBind.instantiate(load(module as string), imports || {}).then(
      (result: BoundWasmModuleInstance<TModule, TImports>) => {
        result.type = "wasm-bound";
        return result;
      }
    );
  } else if (fallback && (module as AsLoaderModule<TModule>).fallback) {
    // eslint-disable-next-line
    return (module as AsLoaderModule<TModule>).fallback!().then(
      (exports: TModule) => ({
        type: "js",
        exports,
      })
    );
  }

  return Promise.reject(
    new Error(
      `Cannot load "${module}" module. WebAssembly is not supported in this environment.`
    )
  );
}

export {
  instantiate,
  // types
  Imports,
  BoundWasmModuleInstance,
  JsModuleInstance,
  BoundModuleInstance,
  AsLoaderModule,
  // pointer types
  Pointer,
  NonPointerTypes,
  NullablePointer,
  PointerCast,
  PointerCastArray,
  PointerCastFunction,
  PointerCastInstance,
  PointerCastObject,
  // runtime types
  AsLoaderRuntime,
};
