import * as webpack from "webpack";

function markModuleAsCompiledToWasm(module: webpack.Module) {
  module.buildMeta.asLoaderCompiledToWasm = true;
}

function isModuleCompiledToWasm(module: webpack.Module): boolean {
  return Boolean(
    module.buildMeta.asLoaderCompiledToWasm ||
      (module.issuer && isModuleCompiledToWasm(module.issuer))
  );
}

export { markModuleAsCompiledToWasm, isModuleCompiledToWasm };
