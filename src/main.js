import { BaileysClient } from "./lib/baileys.js";
import { commandLoader } from "./lib/commands.js";
import { db } from "./config/db.js";
import { ENV } from "./config/env.js";
import gradient from "gradient-string";
import chalk from "chalk";

export class WhatsAppBot {
  constructor() {
    this.client = null;
    this.startTime = Date.now();
  }

  async start() {
    try {
      console.log(gradient.rainbow(`🚀 Starting ${ENV.BOT_NAME}...`));
      console.log(chalk.cyan(`📊 Database Mode: ${ENV.DB_MODE.toUpperCase()}`));
      console.log(chalk.cyan(`🏷️ Prefix: ${ENV.PREFIX}`));
      console.log(
        chalk.cyan(
          `🔄 Auto Reconnect: ${ENV.AUTO_RECONNECT ? "Enabled" : "Disabled"}`,
        ),
      );
      
      if (ENV.USE_PAIRING_CODE) {
        console.log(
          chalk.magenta(
            `🔗 Connection Method: Pairing Code (${ENV.PAIRING_NUMBER})`,
          ),
        );
      } else {
        console.log(chalk.magenta(`📱 Connection Method: QR Code`));
      }
      
      await db.connect();
      
      await commandLoader.loadCommands();
      
      this.client = new BaileysClient();
      await this.client.initialize();
      
      console.log(gradient.morning("✅ Bot started successfully!"));
    } catch (error) {
      console.error("❌ Failed to start bot:", error);
      process.exit(1);
    }
  }
  
  async restart() {
    console.log("🔄 Restarting bot...");

    if (this.client) {
      await this.client.disconnect();
    }

    await commandLoader.reloadCommands();

    this.client = new BaileysClient();
    await this.client.initialize();

    console.log("✅ Bot restarted successfully!");
  }
}

export const bot = new WhatsAppBot();

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)