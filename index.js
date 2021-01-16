const path = require("path");
const asc = require("assemblyscript/cli/asc.js");
const schema = require("./schema.json");
const { getOptions } = require("loader-utils");
const { validate } = require("schema-utils");

/**
 * @param {object} options
 * @returns {string[]}
 */
function mapOptionsToArgs(options) {
  const args = [];
  for (const key in options) {
    if (typeof options[key] === "boolean") {
      args.push("--" + key);
    } else if (
      typeof options[key] === "string" ||
      typeof options[key] === "number"
    ) {
      args.push("--" + key, String(options[key]));
    } else if (Array.isArray(options[key])) {
      args.push("--" + key, options[key].join(","));
    } else if (typeof options[key] === "object" && options[key] !== null) {
      args.push(...mapOptionsToArgs(options[key]));
    }
  }
  return args;
}

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

  const basePath = this.resourcePath.replace(/\.\w+$/, "");
  const binaryFile = basePath + ".wasm";
  const sourceMapFile = binaryFile + ".map";
  /** @type {Object.<string, Buffer>} */
  const output = {};
  /** @type {Error|undefined} */
  let lastError;

  const args = [
    path.basename(this.resourcePath),
    "--baseDir",
    path.dirname(this.resourcePath),
    "--binaryFile",
    binaryFile,
    ...mapOptionsToArgs(options),
  ];
  if (this.sourceMap) {
    args.push("--sourceMap");
  }

  /**
   * @param {string} fileName
   * @param {string} baseDir
   * @returns {string|null}
   * @this {webpack.loader.LoaderContext}
   */
  function readFile(fileName, baseDir) {
    const filePath = path.resolve(baseDir, path.basename(fileName));

    try {
      const content =
        filePath === this.resourcePath
          ? buffer
          : this.fs.readFileSync(filePath, "utf8");
      return typeof content === "string" ? content : content.toString("utf8");
    } catch (error) {
      lastError = error;
      return null;
    }
  }

  /**
   * @param {string} fileName
   * @param {string} contents
   * @param {string} baseDir
   * @returns {boolean}
   * @this {webpack.loader.LoaderContext}
   */
  function writeFile(fileName, contents, baseDir) {
    const filePath = path.resolve(baseDir, path.basename(fileName));
    output[filePath] = contents;
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
      return this.fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"));
    } catch (error) {
      lastError = error;
      return null;
    }
  }

  asc.main(
    args,
    {
      readFile: readFile.bind(this),
      writeFile: writeFile.bind(this),
      listFiles: listFiles.bind(this),
    },
    (error) => {
      if (error) return callback(error);

      const binary = output[binaryFile];
      const sourceMap = output[sourceMapFile];

      if (!binary)
        return callback(
          lastError || new Error("Unknown error on compiling AssemblyScript.")
        );

      return callback(null, binary, sourceMap);
    }
  );
}
loader.raw = true;

module.exports = loader;
