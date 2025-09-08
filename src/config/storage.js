import fs from "fs-extra";
import path from "path";
import { ENV } from "./env.js";
import { Session, User } from "./db.js";

const JSON_DIR = "src/models/json";

class StorageAdapter {
  constructor() {
    this.ensureJsonDirectories();
  }

  ensureJsonDirectories() {
    if (ENV.DB_MODE === "json") {
      fs.ensureDirSync(JSON_DIR);

      // Ensure JSON files exist
      const files = ["sessions.json", "users.json"];
      files.forEach((file) => {
        const filePath = path.join(JSON_DIR, file);
        if (!fs.existsSync(filePath)) {
          fs.writeJsonSync(filePath, {});
        }
      });
    }
  }

  // Session Storage
  async saveSession(sessionId, sessionData) {
    if (ENV.DB_MODE === "mongodb") {
      await Session.findOneAndUpdate(
        { id: sessionId },
        { data: sessionData, updatedAt: new Date() },
        { upsert: true },
      );
    } else {
      const filePath = path.join(JSON_DIR, "sessions.json");
      const sessions = await fs.readJson(filePath);
      sessions[sessionId] = {
        data: sessionData,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeJson(filePath, sessions, { spaces: 2 });
    }
  }

  async getSession(sessionId) {
    if (ENV.DB_MODE === "mongodb") {
      const session = await Session.findOne({ id: sessionId });
      return session?.data || null;
    } else {
      const filePath = path.join(JSON_DIR, "sessions.json");
      const sessions = await fs.readJson(filePath);
      return sessions[sessionId]?.data || null;
    }
  }

  async deleteSession(sessionId) {
    if (ENV.DB_MODE === "mongodb") {
      await Session.deleteOne({ id: sessionId });
    } else {
      const filePath = path.join(JSON_DIR, "sessions.json");
      const sessions = await fs.readJson(filePath);
      delete sessions[sessionId];
      await fs.writeJson(filePath, sessions, { spaces: 2 });
    }
  }

  // User Storage
  async saveUser(jid, userData) {
    if (ENV.DB_MODE === "mongodb") {
      await User.findOneAndUpdate(
        { jid },
        { ...userData, updatedAt: new Date() },
        { upsert: true },
      );
    } else {
      const filePath = path.join(JSON_DIR, "users.json");
      const users = await fs.readJson(filePath);
      users[jid] = {
        ...userData,
        updatedAt: new Date().toISOString(),
      };
      await fs.writeJson(filePath, users, { spaces: 2 });
    }
  }

  async getUser(jid) {
    if (ENV.DB_MODE === "mongodb") {
      const user = await User.findOne({ jid });
      return user || this.createDefaultUser(jid);
    } else {
      const filePath = path.join(JSON_DIR, "users.json");
      const users = await fs.readJson(filePath);
      return users[jid] || this.createDefaultUser(jid);
    }
  }

  createDefaultUser(jid) {
    const permissions = ["user"];

    // Check if user is owner or admin
    if (jid.replace("@s.whatsapp.net", "") === ENV.OWNER_NUMBER) {
      permissions.push("owner", "admin");
    } else if (ENV.ADMIN_NUMBERS.includes(jid.replace("@s.whatsapp.net", ""))) {
      permissions.push("admin");
    }

    return {
      jid,
      name: "",
      permissions,
      cooldowns: {},
      createdAt: new Date().toISOString(),
    };
  }

  async getAllUsers() {
    if (ENV.DB_MODE === "mongodb") {
      return await User.find({});
    } else {
      const filePath = path.join(JSON_DIR, "users.json");
      const users = await fs.readJson(filePath);
      return Object.values(users);
    }
  }
}

export const storage = new StorageAdapter();
