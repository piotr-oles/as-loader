import { Imports, instantiate as asInstantiate } from "@assemblyscript/loader";
import { AsLoaderModule, ModuleInstance, WasmModuleInstance } from "./types";

// eslint-disable-next-line
const context: any =
  (typeof self === "object" && self.self === self && self) ||
  (typeof global === "object" && global.global === global && global) ||
  this;

const defaultSupports = () => Boolean(context && context.WebAssembly);

async function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: Imports | undefined,
  fallback: false,
  supports?: () => boolean
): Promise<WasmModuleInstance<TModule>>;
async function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: Imports,
  fallback?: true,
  supports?: () => boolean
): Promise<ModuleInstance<TModule>>;
async function instantiate<TModule>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: Imports = {},
  fallback = true,
  supports = defaultSupports
): Promise<ModuleInstance<TModule>> {
  const moduleURL: AsLoaderModule<TModule> = module as never;

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

export { instantiate, Imports };
export * from "./types";
