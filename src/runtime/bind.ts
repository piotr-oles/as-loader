import type { Imports } from "@assemblyscript/loader";
import * as AsBind from "as-bind";
import type {
  BoundWasmModuleInstance,
  JsModuleInstance,
  BoundModuleInstance,
  AsLoaderModule,
} from "./types";
import { context } from "./context";
import "./types/std";

async function instantiate<
  TModule,
  TImports extends Imports | undefined = Imports | undefined
>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: TImports,
  fallback: false,
  supports?: () => boolean
): Promise<BoundWasmModuleInstance<TModule, TImports>>;
async function instantiate<
  TModule,
  TImports extends Imports | undefined = Imports | undefined
>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports?: TImports,
  fallback?: true,
  supports?: () => boolean
): Promise<BoundModuleInstance<TModule, TImports>>;
async function instantiate<
  TModule,
  TImports extends Imports | undefined = Imports | undefined
>(
  module: TModule | string,
  load: (url: string) => Promise<unknown>,
  imports: TImports = {} as TImports,
  fallback = true,
  supports = () => Boolean(context && context.WebAssembly)
): Promise<BoundModuleInstance<TModule, TImports>> {
  const moduleURL: AsLoaderModule<TModule> = module as never;

  if (supports()) {
    // WebAssembly is supported
    return {
      type: "wasm-bound",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - invalid as-bind typings
      ...(await AsBind.instantiate(load(moduleURL as string), imports)),
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
  BoundWasmModuleInstance,
  JsModuleInstance,
  BoundModuleInstance,
  AsLoaderModule,
};
export * from "./types/pointer";
export * from "./types/bound";
export * from "./types/runtime";
