/**
 * Add warning to module.
 * Supports webpack 4 and webpack 5.
 */
function addWarningToModule(module: any, error: Error) {
  if (typeof module.addWarning === "function") {
    module.addWarning(error);
  } else if (Array.isArray(module.warnings)) {
    module.warnings.push(error);
  }
}

/**
 * Add error to module.
 * Supports webpack 4 and webpack 5.
 */
function addErrorToModule(module: any, error: Error) {
  if (typeof module.addError === "function") {
    module.addError(error);
  } else if (Array.isArray(module.errors)) {
    module.errors.push(error);
  }
}

export { addWarningToModule, addErrorToModule };
