const path = require("path");
const lineColumn = require("line-column");
const formatLocation = require("webpack/lib/formatLocation");

class AssemblyScriptError extends Error {
  /**
   * @param {string} message
   * @param {string | undefined} file
   * @param {DependencyLocation | undefined} loc
   */
  constructor(message, file, loc) {
    super(message);

    this.name = "AssemblyScriptError";
    this.message = message;
    this.file = file;

    // webpack quirks...
    if (loc && (loc.start || loc.end)) {
      this.file += ` ${formatLocation(loc)}`;
    }

    Error.captureStackTrace(this, this.constructor);
  }

  static fromDiagnostic(diagnostic, host, baseDir, context) {
    const fileName =
      diagnostic.range &&
      diagnostic.range.source &&
      diagnostic.range.source.normalizedPath;
    const loc = {};

    if (fileName) {
      const fileContent = host.readFile(fileName, baseDir);
      if (fileContent) {
        const lineColumnFinder = lineColumn(fileContent);
        const start =
          diagnostic.range && lineColumnFinder
            ? lineColumnFinder.fromIndex(diagnostic.range.start)
            : undefined;
        const end =
          diagnostic.range && lineColumnFinder
            ? lineColumnFinder.fromIndex(diagnostic.range.end)
            : undefined;

        if (start) {
          loc.start = { line: start.line, column: start.col };
        }
        if (end) {
          loc.end = { line: end.line, column: end.col };
        }
      }
    }

    const baseUrl = path.relative(context, baseDir);
    const file = `./${path.join(baseUrl, fileName)}`;

    return new AssemblyScriptError(diagnostic.message, file, loc);
  }
}

module.exports = { AssemblyScriptError };
