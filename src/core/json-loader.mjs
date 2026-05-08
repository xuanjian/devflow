import fs from "node:fs/promises";
import { toPath } from "./paths.mjs";

export async function readJsonFile(pathLike) {
  const filePath = toPath(pathLike);

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return {
      ok: true,
      data: JSON.parse(raw),
      path: filePath
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        ok: false,
        data: null,
        path: filePath,
        error: {
          code: "missing_file",
          message: `Missing JSON file: ${filePath}`
        }
      };
    }

    if (error instanceof SyntaxError) {
      return {
        ok: false,
        data: null,
        path: filePath,
        error: {
          code: "invalid_json",
          message: `Invalid JSON file: ${filePath}: ${error.message}`
        }
      };
    }

    return {
      ok: false,
      data: null,
      path: filePath,
      error: {
        code: "read_error",
        message: error?.message || String(error)
      }
    };
  }
}
