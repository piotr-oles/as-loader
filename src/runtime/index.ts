// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./types/std.ts" />
import {
  Imports,
  instantiate as asLoaderInstantiate,
  ResultObject,
} from "@assemblyscript/loader";
import type {
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
  AsLoaderModule,
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

function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: Imports,
  fallback?: false,
  supports?: () => boolean
): Promise<WasmModuleInstance<TModule>>;
function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: Imports | undefined,
  fallback: true,
  supports?: () => boolean
): Promise<ModuleInstance<TModule>>;
function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: Imports,
  fallback?: boolean,
  supports = () => typeof WebAssembly === "object"
): Promise<ModuleInstance<TModule>> {
  if (supports()) {
    // WebAssembly is supported
    return asLoaderInstantiate<never>(
      load(module as string),
      imports || {}
    ).then(
      (
        result: ResultObject & {
          exports: AsLoaderRuntime & PointerCastObject<TModule>;
        }
      ) => ({
        type: "wasm",
        exports: result.exports,
        instance: result.instance,
        module: result.module,
      })
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
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
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
