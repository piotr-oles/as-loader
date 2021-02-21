import path from "path";
import webpack from "webpack";
import asc from "assemblyscript/cli/asc";
import { DiagnosticCategory } from "assemblyscript";
import { getOptions, interpolateName } from "loader-utils";
import { validate } from "schema-utils";
import { Schema } from "schema-utils/declarations/validate";
import { createCompilerHost } from "./compiler-host";
import { mapAscOptionsToArgs } from "./options";
import { AssemblyScriptError } from "./error";
import schema from "./options.json";
import { addErrorToModule, addWarningToModule } from "./webpack";

function loader(this: webpack.loader.LoaderContext, buffer: Buffer) {
  const options = getOptions(this);
  validate(schema as Schema, options, {
    name: "AssemblyScript Loader",
    baseDataPath: "options",
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const callback = this.async()!;
  let isDone = false;

  const module = this._module;

  const {
    name = "[name].[contenthash].wasm",
    context = this.rootContext,
    ...ascOptions
  } = options;

  const interpolatedName = interpolateName(this, String(name), {
    context,
    content: buffer.toString(),
  });

  const shouldGenerateSourceMap = this.sourceMap;
  const baseDir = path.dirname(this.resourcePath);
  const binaryFileName = interpolatedName;
  const sourceMapFileName = binaryFileName + ".map";

  const host = createCompilerHost(this);

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
        stdout: host.stdout,
      },
      (error) => {
        // prevent from multiple callback calls from asc side
        if (isDone) {
          return 0;
        }
        isDone = true;

        const diagnostics = host.getDiagnostics();

        diagnostics.forEach((diagnostic) => {
          const error = AssemblyScriptError.fromDiagnostic(
            diagnostic,
            host,
            baseDir,
            String(context)
          );

          if (diagnostic.category === DiagnosticCategory.ERROR) {
            addErrorToModule(module, error);
          } else {
            addWarningToModule(module, error);
          }
        });
        const errorDiagnostics = diagnostics.filter(
          (diagnostic) => diagnostic.category === DiagnosticCategory.ERROR
        );
        if (errorDiagnostics.length) {
          const errorsWord = errorDiagnostics.length === 1 ? "error" : "errors";
          callback(
            new AssemblyScriptError(
              `Compilation failed - found ${errorDiagnostics.length} ${errorsWord}.`
            )
          );
          return 1;
        } else if (error) {
          callback(error);
          return 2;
        }

        const binary = host.readFile(binaryFileName, baseDir);
        const sourceMap = shouldGenerateSourceMap
          ? host.readFile(sourceMapFileName, baseDir)
          : undefined;

        if (!binary) {
          callback(
            new AssemblyScriptError("Error on compiling AssemblyScript.")
          );
          return 3;
        }

        this.emitFile(binaryFileName, binary, null);
        if (sourceMap) {
          this.emitFile(sourceMapFileName, sourceMap, null);
        }
        callback(null, `module.exports = ${JSON.stringify(binaryFileName)}`);
        return 0;
      }
    );
  });
}
loader.raw = true;

module.exports = loader;
