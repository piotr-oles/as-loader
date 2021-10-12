import * as webpack from "webpack";

interface CompatibleWebpackModule {
  addWarning?(warning: Error): void;
  addError?(error: Error): void;
  warnings: Error[];
  errors: Error[];
}

/**
 * Add warning to module.
 * Supports webpack 4 and webpack 5.
 */
function addWarningToModule(module: CompatibleWebpackModule, error: Error) {
  if (typeof module.addWarning === "function") {
    module.addWarning(error);
  } else {
    module.warnings.push(error);
  }
}

/**
 * Add error to module.
 * Supports webpack 4 and webpack 5.
 */
function addErrorToModule(module: CompatibleWebpackModule, error: Error) {
  if (typeof module.addError === "function") {
    module.addError(error);
  } else {
    module.errors.push(error);
  }
}

function markModuleAsCompiledToWasm(module: webpack.Module) {
  module.buildMeta.asLoaderCompiledToWasm = true;
}

function isModuleCompiledToWasm(module: webpack.Module): boolean {
  return Boolean(
    module.buildMeta.asLoaderCompiledToWasm ||
      (module.issuer && isModuleCompiledToWasm(module.issuer))
  );
}

export {
  addWarningToModule,
  addErrorToModule,
  markModuleAsCompiledToWasm,
  isModuleCompiledToWasm,
};
