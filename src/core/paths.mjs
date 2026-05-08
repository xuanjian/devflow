import path from "node:path";
import { fileURLToPath } from "node:url";

export function toPath(pathLike) {
  if (pathLike instanceof URL) {
    return fileURLToPath(pathLike);
  }
  return path.resolve(String(pathLike));
}

export function resolveInside(rootDir, relativePath) {
  const rootPath = toPath(rootDir);
  return path.resolve(rootPath, relativePath);
}

export function toPosixPath(filePath) {
  return String(filePath).split(path.sep).join("/");
}
