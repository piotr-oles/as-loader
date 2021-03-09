import {
  ASUtil,
  Imports,
  instantiate as asInstantiate,
  ResultObject,
} from "@assemblyscript/loader";
import { AsLoaderModuleURL } from "./types";

interface WasmModuleInstance<TModule> extends ResultObject {
  type: "wasm";
  exports: ASUtil & TModule;
}

interface JsModuleInstance<TModule> {
  type: "js";
  exports: TModule;
}

type ModuleInstance<TModule> =
  | WasmModuleInstance<TModule>
  | JsModuleInstance<TModule>;

async function instantiate<TModule>(
  module: TModule | string,
  supports: () => boolean,
  load: (url: string) => Promise<unknown>,
  imports?: Imports,
  fallback = true
): Promise<ModuleInstance<TModule>> {
  const moduleURL: AsLoaderModuleURL<TModule> = module as never;

  if (supports()) {
    // WebAssembly is supported
    return {
      type: "wasm",
      ...(await asInstantiate<never>(load(moduleURL as string), imports)),
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
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
  Imports,
};
