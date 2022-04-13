import * as path from "path";
import * as asc from "assemblyscript/cli/asc";
import { DiagnosticCategory } from "assemblyscript";
import { getOptions, interpolateName, OptionObject } from "loader-utils";
import { validate } from "schema-utils";
import { Schema } from "schema-utils/declarations/validate";
import { createCompilerHost } from "./compiler-host";
import { mapAscOptionsToArgs, Options } from "./options";
import { AssemblyScriptError } from "./error";
import * as schema from "./schema.json";
import { isModuleCompiledToWasm, markModuleAsCompiledToWasm } from "./webpack";

const SUPPORTED_EXTENSIONS = [".wasm", ".js"];

interface LoaderOptions {
  readonly name?: string;
  readonly raw?: boolean;
  readonly fallback?: boolean;
}

type CompilerOptions = OptionObject;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loader(this: any, content: string, map?: any, meta?: any) {
  const options = getOptions(this);
  validate(schema as Schema, options, {
    name: "AssemblyScript Loader",
    baseDataPath: "options",
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const callback = this.async()!;
  let isDone = false;

  const module = this._module;
  const context = this.rootContext;

  const {
    name = "[name].[contenthash].wasm",
    raw = false,
    fallback = false,
    bind = false,
    ...userAscOptions
  } = options as LoaderOptions & CompilerOptions;

  if (isModuleCompiledToWasm(module)) {
    // skip asc compilation - forward request to a fallback loader
    return callback(null, content, map, meta);
  }

  if (!SUPPORTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    throw new Error(
      `Unsupported extension in name: "${name}" option in as-loader. ` +
        `Supported extensions are ${SUPPORTED_EXTENSIONS.join(", ")}`
    );
  }

  if (fallback) {
    if (module.type?.startsWith("webassembly")) {
      throw new Error(
        `Cannot use fallback option together with module type "${module.type}". ` +
          `Use standard module type or disable fallback option.`
      );
    } else if (raw) {
      throw new Error(`Cannot use fallback option together with raw option.`);
    }
  }

  if (name.endsWith(".js")) {
    throw new Error(
      `Cannot use .js extension directly. Please use fallback option instead.`
    );
  }

  const ascOptions: Options = {
    // default options
    // when user imports wasm with webassembly type, it's not possible to pass env
    runtime: module.type?.startsWith("webassembly") ? "stub" : "incremental",
    exportRuntime:
      !module.type?.startsWith("webassembly") &&
      userAscOptions.exportRuntime !== "stub",
    debug: this.mode === "development",
    optimizeLevel: 3,
    shrinkLevel: 1,
    noAssert: this.mode === "production",
    // user options
    ...userAscOptions,
  };

  if (bind) {
    // overwrite options for bind
    ascOptions.exportRuntime = true;
    ascOptions.transform = "as-bind";
  }

  const shouldGenerateSourceMap = this.sourceMap;
  const baseDir = path.dirname(this.resourcePath);
  const outFileName = interpolateName(this, name, {
    context,
    content,
  });
  const sourceMapFileName = outFileName + ".map";

  const host = createCompilerHost(this);

  if (shouldGenerateSourceMap) {
    ascOptions.sourceMap = true;
  }

  const args = [
    path.basename(this.resourcePath),
    "--baseDir",
    baseDir,
    "--outFile",
    outFileName,
    ...mapAscOptionsToArgs(ascOptions),
  ];

  asc.ready
    .then(() => {
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
              module.addError(error);
            } else {
              module.addWarning(error);
            }
          });
          const errorDiagnostics = diagnostics.filter(
            (diagnostic) => diagnostic.category === DiagnosticCategory.ERROR
          );
          if (errorDiagnostics.length) {
            const errorsWord =
              errorDiagnostics.length === 1 ? "error" : "errors";
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

          const outFileContent = host.readFile(outFileName, baseDir);
          const sourceMapFileContent = shouldGenerateSourceMap
            ? host.readFile(sourceMapFileName, baseDir)
            : undefined;

          if (!outFileContent) {
            callback(
              new AssemblyScriptError("Error on compiling AssemblyScript.")
            );
            return 3;
          }

          if (outFileName.endsWith(".wasm")) {
            markModuleAsCompiledToWasm(module);

            if (module.type?.startsWith("webassembly") || raw) {
              // uses module type: "webassembly/sync" or "webasssembly/async" or raw: true -
              // return binary instead of emitting files
              let rawSourceMap: unknown = null;
              if (sourceMapFileContent) {
                try {
                  rawSourceMap = JSON.parse(sourceMapFileContent.toString());
                } catch (error) {}
              }
              callback(null, outFileContent, rawSourceMap);
            } else {
              const hashedOutFileName = interpolateName(this, name, {
                context,
                content: Buffer.isBuffer(outFileContent)
                  ? outFileContent.toString("hex")
                  : outFileContent,
              });
              this.emitFile(hashedOutFileName, outFileContent, null, {
                minimized: true,
                immutable: /\[([^:\]]+:)?(hash|contenthash)(:[^\]]+)?]/gi.test(
                  name
                ),
                sourceFilename: path
                  .relative(this.rootContext, this.resourcePath)
                  .replace(/\\/g, "/"),
              });
              if (sourceMapFileContent) {
                this.emitFile(sourceMapFileName, sourceMapFileContent, null, {
                  // we can't easily re-write link from wasm to source map and because of that,
                  // we can't use [contenthash] for source map file name
                  immutable: false,
                  development: true,
                });
              }

              if (fallback) {
                const fallbackRequest = `as-loader?name=${name.replace(
                  /\.wasm$/,
                  ".js"
                )}!${this.resourcePath}`;
                const fallbackChunkName = hashedOutFileName.replace(
                  /\.wasm$/,
                  ""
                );

                callback(
                  null,
                  [
                    `function fallback() {`,
                    `  return import(`,
                    `    /* webpackChunkName: ${JSON.stringify(
                      fallbackChunkName
                    )} */`,
                    `    ${JSON.stringify(fallbackRequest)}`,
                    `  );`,
                    `}`,
                    `var path = new String(__webpack_public_path__ + ${JSON.stringify(
                      hashedOutFileName
                    )});`,
                    "path.fallback = fallback;",
                    `module.exports = path;`,
                  ].join("\n")
                );
              } else {
                callback(
                  null,
                  `module.exports = __webpack_public_path__ + ${JSON.stringify(
                    hashedOutFileName
                  )};`
                );
              }
            }
          } else if (outFileName.endsWith(".js")) {
            let rawSourceMap: unknown = null;
            if (sourceMapFileContent) {
              try {
                rawSourceMap = JSON.parse(sourceMapFileContent.toString());
              } catch (error) {}
            }
            callback(null, outFileContent, rawSourceMap);
          }

          return 0;
        }
      );
    })
    .catch((error) => {
      callback(error);
    });
}

module.exports = loader;
