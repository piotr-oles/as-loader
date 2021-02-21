import path from "path";
import asc, { DiagnosticMessage, APIOptions } from "assemblyscript/cli/asc";

type CompilerHost = Required<APIOptions> & {
  getDiagnostics(): DiagnosticMessage[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCompilerHost(context: any): CompilerHost {
  const memVolume: Record<string, Buffer> = {};
  const stderr = asc.createMemoryStream();
  const stdout = asc.createMemoryStream();
  const diagnostics: DiagnosticMessage[] = [];

  function readFile(fileName: string, baseDir: string) {
    const filePath = path.resolve(baseDir, path.basename(fileName));

    if (memVolume[filePath]) {
      return memVolume[filePath];
    }

    try {
      const content = context.fs.readFileSync(filePath, "utf8");
      context.addDependency(filePath);

      return typeof content === "string" ? content : content.toString("utf8");
    } catch (error) {
      return null;
    }
  }

  function writeFile(fileName: string, contents: Uint8Array, baseDir: string) {
    const filePath = baseDir
      ? path.resolve(baseDir, path.basename(fileName))
      : fileName;

    memVolume[filePath] = Buffer.isBuffer(contents)
      ? contents
      : Buffer.from(contents);

    return true;
  }

  function listFiles(dirName: string, baseDir: string) {
    const dirPath = baseDir ? path.resolve(baseDir, dirName) : dirName;

    try {
      return context.fs
        .readdirSync(dirPath)
        .filter(
          (file: string) => file.endsWith(".ts") && !file.endsWith(".d.ts")
        );
    } catch (error) {
      return null;
    }
  }

  function reportDiagnostic(diagnostic: DiagnosticMessage) {
    diagnostics.push(diagnostic);
  }

  function getDiagnostics(): DiagnosticMessage[] {
    return diagnostics;
  }

  return {
    readFile,
    writeFile,
    listFiles,
    reportDiagnostic,
    getDiagnostics,
    stderr,
    stdout,
  };
}

export { createCompilerHost, CompilerHost };
