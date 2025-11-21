import fs from "node:fs";
import path from "node:path";

export class FileSystemService {
  constructor(workingDirectory) {
    this.workingDirectory = this._resolveWorkingDirectory(workingDirectory);
    this._assertDirectory(this.workingDirectory);
  }

  normalizeFilePath(pattern) {
    if (!pattern) {
      return pattern;
    }

    if (path.isAbsolute(pattern)) {
      return path.normalize(pattern);
    }

    return path.join(this.workingDirectory, pattern);
  }

  resolveFilePath(file) {
    const normalizedFile = this.normalizeFilePath(file);
    if (!normalizedFile) {
      throw new Error(`Cannot resolve empty file path: ${file}`);
    }

    return path.resolve(normalizedFile);
  }

  readFile(filePath, encoding = "utf-8") {
    const resolvedPath = this.resolveFilePath(filePath);
    this._assertFile(resolvedPath);

    return fs.readFileSync(resolvedPath, encoding);
  }

  _resolveWorkingDirectory(workingDirectory) {
    const fallbackWorkspace = process.cwd();

    if (!workingDirectory || workingDirectory === ".") {
      return fallbackWorkspace;
    }

    if (path.isAbsolute(workingDirectory)) {
      return path.resolve(workingDirectory);
    }

    return path.resolve(fallbackWorkspace, workingDirectory);
  }

  _assertFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`File does not exist: ${filePath}`);
      }
      throw error;
    }
  }

  _assertDirectory(directoryPath) {
    try {
      const stats = fs.statSync(directoryPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${directoryPath}`);
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`Directory does not exist: ${directoryPath}`);
      }
      throw error;
    }
  }
}
