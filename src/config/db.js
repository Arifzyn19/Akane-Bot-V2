import mongoose from "mongoose";
import { ENV } from "./env.js";

class Database {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (ENV.DB_MODE !== "mongodb") {
      console.log("📁 Using JSON storage mode");
      return true;
    }

    try {
      await mongoose.connect(ENV.MONGO_URI);
      this.isConnected = true;
      console.log("🗄️ MongoDB connected successfully");
      return true;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      return false;
    }
  }

  async disconnect() {
    if (ENV.DB_MODE === "mongodb" && this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log("🗄️ MongoDB disconnected");
    }
  }
}

// MongoDB Schemas
const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  jid: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  permissions: { type: [String], default: ["user"] },
  cooldowns: { type: Map, of: Date, default: new Map() },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Session = mongoose.model("Session", sessionSchema);
export const User = mongoose.model("User", userSchema);
export const db = new Database();
