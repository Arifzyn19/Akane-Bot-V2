import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import fs from "fs";
import os from "os";
import { createRequire } from "module";

/**
 * @param {ImportMeta | string} pathURL
 * @param {boolean?} rmPrefix if value is `'true'`, it will remove `'file://'` prefix, if windows it will automatically false
 */
const __filename = function filename(
  pathURL = import.meta,
  rmPrefix = os.platform() !== "win32",
) {
  const path =
    /** @type {ImportMeta} */ (pathURL).url || /** @type {String} */ (pathURL);
  return rmPrefix
    ? /file:\/\/\//.test(path)
      ? fileURLToPath(path)
      : path
    : /file:\/\/\//.test(path)
      ? path
      : pathToFileURL(path).href;
};

/** @param {ImportMeta | string} pathURL */
const __dirname = function dirname(pathURL) {
  const dir = __filename(pathURL, true);
  const regex = /\/$/;
  return regex.test(dir)
    ? dir
    : fs.existsSync(dir) && fs.statSync(dir).isDirectory()
      ? dir.replace(regex, "")
      : path.dirname(dir); // windows
};

/** @param {ImportMeta | string} dir */
const __require = function require(dir = import.meta) {
  const path =
    /** @type {ImportMeta} */ (dir).url || /** @type {String} */ (dir);
  return createRequire(path);
};

export default {
  __filename,
  __dirname,
  __require,
};
