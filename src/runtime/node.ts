import { Imports } from "@assemblyscript/loader";
import fs from "fs";
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
    () => Boolean(global.WebAssembly),
    (url) =>
      new Promise((resolve, reject) =>
        fs.readFile(url, (error, buffer) => {
          if (error) {
            reject(error);
          } else {
            resolve(buffer);
          }
        })
      ),
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
