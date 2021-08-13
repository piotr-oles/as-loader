import type { AsLoaderRuntime } from "./runtime";
import type { PointerCastObject } from "./pointer";
import type { BoundExports } from "./bound";

export interface AsLoaderModule<TModule> extends String {
  fallback?(): Promise<TModule>;
}

export interface WasmModuleInstance<TModule> {
  type: "wasm";
  exports: AsLoaderRuntime & PointerCastObject<TModule>;
  module: WebAssembly.Module;
  instance: WebAssembly.Instance;
}
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
export type ModuleInstance<TModule> =
  | WasmModuleInstance<TModule>
  | JsModuleInstance<TModule>;
export type BoundModuleInstance<TModule, TImport> =
  | BoundWasmModuleInstance<TModule, TImport>
  | JsModuleInstance<TModule>;
