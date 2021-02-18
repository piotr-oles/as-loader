const path = require("path");
const asc = require("assemblyscript/cli/asc.js");
const { DiagnosticCategory } = require("assemblyscript");
const { getOptions, interpolateName } = require("loader-utils");
const { validate } = require("schema-utils");
const schema = require("./options.json");
const { createHost } = require("./host");
const { mapAscOptionsToArgs } = require("./options");
const { AssemblyScriptError } = require("./error");

/**
 * @param {Buffer} buffer
 * @this {webpack.loader.LoaderContext}
 */
function loader(buffer) {
  const options = getOptions(this);
  validate(schema, options, {
    name: "AssemblyScript Loader",
    baseDataPath: "options",
  });

  const callback = this.async();
  let isDone = false;

  const module = this._module;

  const {
    name = "[name].[contenthash].wasm",
    context = this.rootContext,
    ...ascOptions
  } = options;

  const interpolatedName = interpolateName(this, name, {
    context,
    content: buffer.toString(),
  });

  const shouldGenerateSourceMap = this.sourceMap;
  const baseDir = path.dirname(this.resourcePath);
  const binaryFileName = interpolatedName;
  const sourceMapFileName = binaryFileName + ".map";

  const host = createHost(this);

  const addWarning = (error) => {
    if (typeof module.addWarning === "function") {
      module.addWarning(error);
    } else if (Array.isArray(module.warnings)) {
      module.warnings.push(error);
    }
  };
  const addError = (error) => {
    if (typeof module.addError === "function") {
      module.addError(error);
    } else if (Array.isArray(module.errors)) {
      module.errors.push(error);
    }
  };

  const args = [
    path.basename(this.resourcePath),
    "--baseDir",
    baseDir,
    "--binaryFile",
    binaryFileName,
    ...mapAscOptionsToArgs(ascOptions),
  ];
  if (shouldGenerateSourceMap) {
    args.push("--sourceMap", "--debug");
  }

  asc.ready.then(() => {
    asc.main(
      args,
      {
        readFile: host.readFile,
        writeFile: host.writeFile,
        listFiles: host.listFiles,
        reportDiagnostic: host.reportDiagnostic,
        stderr: host.stderr,
      },
      (error) => {
        // prevent from multiple callback calls from asc side
        if (isDone) {
          return;
        }
        isDone = true;

        const diagnostics = host.getDiagnostics();

        diagnostics.forEach((diagnostic) => {
          const error = AssemblyScriptError.fromDiagnostic(
            diagnostic,
            host,
            baseDir,
            context
          );

          if (diagnostic.category === DiagnosticCategory.ERROR) {
            addError(error);
          } else {
            addWarning(error);
          }
        });
        const errorDiagnostics = diagnostics.filter(
          (diagnostic) => diagnostic.category === DiagnosticCategory.ERROR
        );
        if (errorDiagnostics.length) {
          const errorsWord = errorDiagnostics.length === 1 ? "error" : "errors";
          return callback(
            new AssemblyScriptError(
              `Compilation failed - found ${errorDiagnostics.length} ${errorsWord}.`
            )
          );
        } else if (error) {
          return callback(error);
        }

        const binary = host.readFile(binaryFileName, baseDir);
        const sourceMap = shouldGenerateSourceMap
          ? host.readFile(sourceMapFileName, baseDir)
          : undefined;

        if (!binary) {
          return callback(
            new AssemblyScriptError("Error on compiling AssemblyScript.")
          );
        }

        this.emitFile(binaryFileName, binary, null);
        if (sourceMap) {
          this.emitFile(sourceMapFileName, sourceMap, null);
        }
        return callback(
          null,
          `module.exports = ${JSON.stringify(binaryFileName)}`
        );
      }
    );
  });
}
loader.raw = true;

module.exports = loader;
