import {
  Imports,
  instantiate as asLoaderInstantiate,
} from "@assemblyscript/loader";
import type {
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
  AsLoaderModule,
} from "./types";
import { context } from "./context";

async function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: Imports,
  fallback?: false,
  supports?: () => boolean
): Promise<WasmModuleInstance<TModule>>;
async function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: Imports | undefined,
  fallback: true,
  supports?: () => boolean
): Promise<ModuleInstance<TModule>>;
async function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: Imports = {},
  fallback = false,
  supports = () => Boolean(context && context.WebAssembly)
): Promise<ModuleInstance<TModule>> {
  const moduleURL: AsLoaderModule<TModule> = module as never;

  if (supports()) {
    // WebAssembly is supported
    return {
      type: "wasm",
      ...(await asLoaderInstantiate<never>(load(moduleURL as string), imports)),
    };
  } else if (fallback && moduleURL.fallback) {
    return {
      type: "js",
      exports: await moduleURL.fallback(),
    };
  }

  throw new Error(
    `Cannot load "${moduleURL}" module. WebAssembly is not supported in this environment.`
  );
}

export {
  instantiate,
  Imports,
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
  AsLoaderModule,
};
export * from "./types/pointer";
export * from "./types/runtime";
