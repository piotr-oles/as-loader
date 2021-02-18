const path = require("path");
const asc = require("assemblyscript/cli/asc.js");

/**
 * @param {webpack.loader.LoaderContext} context
 */
function createHost(context) {
  /** @type {Object.<string, Buffer>} */
  const memfs = {};
  const stderr = asc.createMemoryStream();
  /** @type {DiagnosticMessage[]} */
  const diagnostics = [];

  /**
   * @param {string} fileName
   * @param {string} baseDir
   * @returns {string|null}
   * @this {webpack.loader.LoaderContext}
   */
  function readFile(fileName, baseDir) {
    const filePath = baseDir
      ? path.resolve(baseDir, path.basename(fileName))
      : fileName;

    if (memfs[filePath]) {
      return memfs[filePath];
    }

    try {
      const content = context.fs.readFileSync(filePath, "utf8");
      context.addDependency(filePath);

      return typeof content === "string" ? content : content.toString("utf8");
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {string} fileName
   * @param {Buffer | Uint8Array} contents
   * @param {string} baseDir
   * @returns {boolean}
   * @this {webpack.loader.LoaderContext}
   */
  function writeFile(fileName, contents, baseDir) {
    const filePath = baseDir
      ? path.resolve(baseDir, path.basename(fileName))
      : fileName;

    memfs[filePath] = Buffer.isBuffer(contents)
      ? contents
      : Buffer.from(contents);

    return true;
  }

  /**
   * @param {string} dirName
   * @param {string} baseDir
   * @returns {null|string[]}
   * @this {webpack.loader.LoaderContext}
   */
  function listFiles(dirName, baseDir) {
    const dirPath = path.resolve(baseDir, path.basename(dirName));

    try {
      return context.fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"));
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {DiagnosticMessage} diagnostic
   */
  function reportDiagnostic(diagnostic) {
    diagnostics.push(diagnostic);
  }

  /**
   * @returns {DiagnosticMessage[]}
   */
  function getDiagnostics() {
    return diagnostics;
  }

  return {
    readFile,
    writeFile,
    listFiles,
    reportDiagnostic,
    getDiagnostics,
    stderr,
  };
}

module.exports = { createHost };
