import path from "path";
import { DiagnosticMessage } from "assemblyscript/cli/asc";
import { getLineColumnFromIndex } from "./line-column";
import { formatLocation, Location } from "./location";
import { CompilerHost } from "./compiler-host";

class AssemblyScriptError extends Error {
  readonly file: string | undefined;

  constructor(message: string, file?: string, location?: Location) {
    super(message);

    this.name = "AssemblyScriptError";
    this.message = message;
    this.file = file;

    // webpack 4 quirks...
    if (location && (location.start || location.end)) {
      this.file += ` ${formatLocation(location)}`;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  static fromDiagnostic(
    diagnostic: DiagnosticMessage,
    host: CompilerHost,
    baseDir: string,
    context: string
  ) {
    const fileName =
      diagnostic.range &&
      diagnostic.range.source &&
      diagnostic.range.source.normalizedPath;
    let location: Location | undefined;

    if (fileName) {
      const fileContent = host.readFile(fileName, baseDir);
      if (fileContent) {
        const start = diagnostic.range
          ? getLineColumnFromIndex(fileContent, diagnostic.range.start)
          : undefined;
        const end = diagnostic.range
          ? getLineColumnFromIndex(fileContent, diagnostic.range.end)
          : undefined;
        if (start || end) {
          location = { start, end };
        }
      }
    }

    const baseUrl = path.relative(context, baseDir);
    const file = fileName ? `./${path.join(baseUrl, fileName)}` : undefined;

    return new AssemblyScriptError(diagnostic.message, file, location);
  }
}

export { AssemblyScriptError };