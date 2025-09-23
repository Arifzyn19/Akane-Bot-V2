import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import { Jimp } from "jimp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Function {
  static async getFile(PATH, saveToFile = false) {
    let res, filename;
    const data = Buffer.isBuffer(PATH)
      ? PATH
      : PATH instanceof ArrayBuffer
        ? PATH.toBuffer()
        : /^data:.*?\/.*?;base64,/i.test(PATH)
          ? Buffer.from(PATH.split`,`[1], "base64")
          : /^https?:\/\//.test(PATH)
            ? await (res = await fetch(PATH)).arrayBuffer().then(Buffer.from)
            : fs.existsSync(PATH)
              ? ((filename = PATH), fs.readFileSync(PATH))
              : typeof PATH === "string"
                ? PATH
                : Buffer.alloc(0);

    if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");

    const type = (await fileTypeFromBuffer(data)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };

    if (data && saveToFile && !filename) {
      const tempDir = path.join(__dirname, "../../temp/");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      filename = path.join(tempDir, new Date().getTime() + "." + type.ext);
      await fs.promises.writeFile(filename, data);
    }

    return {
      res,
      filename,
      ...type,
      data,
      deleteFile() {
        return filename && fs.promises.unlink(filename);
      },
    };
  }

  static async resizeImage(media, size = 720) {
    const { data } = await this.getFile(media);
    const image = await Jimp.read(data);
    return await image.resize(size, size).getBufferAsync(jimp.MIME_JPEG);
  }

  static escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  
  static sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  static formatUptime = (uptime) => {
  const seconds = Math.floor(uptime % 60);
  const minutes = Math.floor((uptime / 60) % 60);
  const hours = Math.floor((uptime / 3600) % 24);
  const days = Math.floor(uptime / 86400);

  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
  }
}
