import { Imports } from "@assemblyscript/loader";
import {
  ModuleInstance,
  WasmModuleInstance,
  JsModuleInstance,
  instantiate as genericInstantiate,
} from "./loader";

async function instantiate<TModule>(
  module: TModule | string,
  imports?: Imports,
  fallback?: false
): Promise<WasmModuleInstance<TModule>>;
async function instantiate<TModule>(
  module: TModule | string,
  imports?: Imports,
  fallback = true
): Promise<ModuleInstance<TModule>> {
  return genericInstantiate<TModule>(
    module,
    () => Boolean(window.WebAssembly),
    (url) => fetch(url),
    imports,
    fallback
  );
}

export {
  instantiate,
  WasmModuleInstance,
  JsModuleInstance,
  ModuleInstance,
  Imports,
};
