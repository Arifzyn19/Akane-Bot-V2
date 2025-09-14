import { config } from "dotenv";

config();

export const ENV = {
  // Database
  DB_MODE: process.env.DB_MODE || "json",
  DB_PATH: process.env.DB_PATH || "database.json",
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/whatsapp-bot",

  // Bot Configuration
  BOT_NAME: process.env.BOT_NAME || "WhatsApp Bot",
  PREFIX: process.env.PREFIX || "!",
  OWNER_NUMBERS:
    process.env.OWNER_NUMBERS?.split(",") ||
    [process.env.OWNER_NUMBER || ""].filter(Boolean),
  ADMIN_NUMBERS: process.env.ADMIN_NUMBERS?.split(",") || [],

  // Bot Options
  AUTO_RECONNECT: process.env.AUTO_RECONNECT === "true",
  PRINT_QR: process.env.PRINT_QR === "true",
  USE_PAIRING_CODE: process.env.USE_PAIRING_CODE === "true",
  PAIRING_NUMBER: process.env.PAIRING_NUMBER || "",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Commands
  COMMANDS_DIR: process.env.COMMANDS_DIR || "src/commands",

  // message for permission
  msg: {
    rowner: "Fitur ini hanya dapat diakses oleh real owner!",
    owner: "Fitur ini hanya dapat diakses oleh pemilik!",
    group: "Fitur ini hanya dapat diakses di dalam grup!",
    private: "Fitur ini hanya dapat diakses di chat pribadi!",
    admin: "Fitur ini hanya dapat diakses oleh admin grup!",
    botAdmin: "Bot bukan admin, tidak dapat menggunakan fitur ini!",
    bot: "Fitur ini hanya dapat diakses oleh bot",
    premium: "Fitur ini hanya dapat diakses oleh pengguna premium",
    media: "Balas ke media...",
    query: "Tidak ada query?",
    error: "Terjadi kesalahan, silakan ulangi beberapa saat lagi.",
    quoted: "Balas ke pesan...",
    wait: "Tunggu sebentar...",
    urlInvalid: "URL tidak valid",
    notFound: "Hasil tidak ditemukan!",
    register:
      "Silakan lakukan pendaftaran terlebih dahulu untuk menggunakan fitur ini.",
    limit:
      "Limit kamu sudah habis, silahkan ketik .claim atau membeli premium.",
  },
};

ENV.OWNER_NUMBER = ENV.OWNER_NUMBERS[0] || "";

export default ENV;
