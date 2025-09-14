import { ENV } from "../config/env.js";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { cloudDBAdapter, mongoDB, mongoDBV2 } from "./DB_Adapters/index.js";
import lodash from "lodash";
import chalk from "chalk";

function getOpts() {
  return {
    db:
      ENV.DB_MODE === "mongodb"
        ? ENV.MONGO_URI
        : ENV.DB_MODE === "cloud"
          ? ENV.DB_PATH
          : "",
    mongodbv2: ENV.DB_VERSION === "v2",
    _: [ENV.BOT_NAME?.toLowerCase().replace(/\s+/g, "_") || "whatsapp_bot"],
  };
}

const opts = getOpts();
const databaseUrl = opts.db || "";

const databaseAdapter = /https?:\/\//.test(databaseUrl)
  ? new cloudDBAdapter(databaseUrl)
  : /mongodb(\+srv)?:\/\//i.test(databaseUrl)
    ? opts.mongodbv2
      ? new mongoDBV2(databaseUrl)
      : new mongoDB(databaseUrl)
    : new JSONFile(
        ENV.DB_PATH || `${opts._[0] ? opts._[0] + "_" : ""}database.json`,
      );

let defaultData = {
  users: {},
  groups: {},
  stats: {},
  msgs: {},
  sticker: {},
  settings: {},
  bots: {},
};

let database = new Low(databaseAdapter, defaultData);

async function loadDatabase() {
  if (database._read) await database._read;
  if (database.data !== null) return database.data;

  database._read = database.read().catch(console.error);
  await database._read;

  console.log(chalk.green("📊 Database loaded successfully"));

  database.data = {
    ...defaultData,
    ...(database.data || {}),
  };

  database.chain = lodash.chain(database.data);
  return database.data;
}

export { databaseUrl, databaseAdapter, loadDatabase };
export default database;
