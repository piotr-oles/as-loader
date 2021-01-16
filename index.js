const path = require("path");
const { Writable } = require("stream");
const asc = require("assemblyscript/cli/asc.js");
const { getOptions } = require("loader-utils");
const { validate } = require("schema-utils");
const schema = require("./options.json");

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
 * @returns {module:stream.internal.Writable}
 */
function createMemoryStream() {
  let buffer = [];
  const stream = new Writable({
    write(chunk, encoding, callback) {
      buffer.push(chunk.toString());
      callback();
    },
  });
  Object.assign(stream, {
    toString() {
      return buffer.join("");
    },
  });

  return stream;
}

/**
 * utility copied from less-loader
 *
 * @param {object} map
 * @returns {object}
 */
function normalizeSourceMap(map) {
  const newMap = map;

  // map.file is an optional property that provides the output filename.
  // Since we don't know the final filename in the webpack build chain yet, it makes no sense to have it.
  // eslint-disable-next-line no-param-reassign
  delete newMap.file;

  // eslint-disable-next-line no-param-reassign
  newMap.sourceRoot = "";

  // `less` returns POSIX paths, that's why we need to transform them back to native paths.
  // eslint-disable-next-line no-param-reassign
  newMap.sources = newMap.sources.map((source) => path.normalize(source));

  return newMap;
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
  const stderr = createMemoryStream();
  let isDone = false;

  /**
   * @param {string} fileName
   * @param {string} baseDir
   * @returns {string|null}
   * @this {webpack.loader.LoaderContext}
   */
  function readFile(fileName, baseDir) {
    const filePath = path.resolve(baseDir, path.basename(fileName));

    try {
      let content;
      if (filePath === this.resourcePath) {
        content = buffer;
      } else {
        content = this.fs.readFileSync(filePath, "utf8");
        this.addDependency(filePath);
      }
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
    const filePath = path.resolve(baseDir, path.basename(fileName));
    output[filePath] = Buffer.isBuffer(contents)
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
      return this.fs
        .readdirSync(dirPath)
        .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"));
    } catch (error) {
      return null;
    }
  }

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

  asc.main(
    args,
    {
      readFile: readFile.bind(this),
      writeFile: writeFile.bind(this),
      listFiles: listFiles.bind(this),
      stderr,
    },
    (error) => {
      // prevent from multiple callback calls from asc side
      if (isDone) {
        return;
      }
      isDone = true;

      stderr
        .toString()
        .split("\n")
        .forEach((message) => {
          if (message.startsWith("ERROR ")) {
            this.emitError(message.slice("ERROR ".length));
          } else if (message.startsWith("WARNING ")) {
            this.emitWarning(message.slice("WARNING ".length));
          }
        });

      if (error) {
        return callback(error);
      }

      const binary = output[binaryFile];
      const sourceMap = output[sourceMapFile];

      if (!binary) {
        return callback(new Error("Error on compiling AssemblyScript."));
      }

      if (sourceMap) {
        try {
          return callback(
            null,
            binary,
            normalizeSourceMap(JSON.parse(sourceMap.toString()))
          );
        } catch (error) {
          this.emitWarning(
            "Invalid source map has been generated by AssemblyScript."
          );
          return callback(null, binary);
        }
      } else {
        return callback(null, binary);
      }
    }
  );
}
loader.raw = true;

module.exports = loader;
