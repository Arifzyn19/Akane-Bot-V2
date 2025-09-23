import { BaileysClient } from "./lib/baileys.js"
import { loadPluginFiles, pluginFolder, pluginFilter } from "./lib/plugin.js"
import { loadDatabase } from "./lib/database.js"
import { ENV } from "./config/env.js"
import gradient from "gradient-string"
import chalk from "chalk"

export class WhatsAppBot {
  constructor() {
    this.client = null
    this.startTime = Date.now()
    this.server = null
    this.io = null
    this.isServerMode = false
  }

  setServer(server, io) {
    this.server = server
    this.io = io
    this.isServerMode = true
    console.log(chalk.cyan("🔗 Bot connected to Express server"))
  }

  emitToDashboard(event, data) {
    if (this.io) {
      this.io.emit(event, data)
    }
  }

  async start() {
    try {
      console.log(gradient.rainbow(`🚀 Starting ${ENV.BOT_NAME}...`))
      console.log(chalk.cyan(`📊 Database Mode: ${ENV.DB_MODE.toUpperCase()}`))
      console.log(chalk.cyan(`🏷️ Prefix: ${ENV.PREFIX}`))
      console.log(chalk.cyan(`🔄 Auto Reconnect: ${ENV.AUTO_RECONNECT ? "Enabled" : "Disabled"}`))

      if (ENV.USE_PAIRING_CODE) {
        console.log(chalk.magenta(`🔗 Connection Method: Pairing Code (${ENV.PAIRING_NUMBER})`))
      } else {
        console.log(chalk.magenta(`📱 Connection Method: QR Code`))
      }

      await loadDatabase()

      this.client = new BaileysClient()

      if (this.isServerMode) {
        this.client.setBotInstance(this)
      }

      await this.client.initialize()

      try {
        await loadPluginFiles(pluginFolder, pluginFilter, {
          logger: this.client.sock.logger,
          recursiveRead: true,
        })
          .then(() => console.log(chalk.cyan("✓"), chalk.green("Plugins Loader Success!")))
          .catch(console.error)
      } catch (error) {
        console.log(chalk.red("✗"), chalk.red("Error:", error.message))
      }

      this.emitToDashboard("bot:status", {
        status: "connected",
        startTime: this.startTime,
        connectionMethod: ENV.USE_PAIRING_CODE ? "pairing" : "qr",
      })

      console.log(gradient.morning("✅ Bot started successfully!"))
    } catch (error) {
      console.error("❌ Failed to start bot:", error)
      this.emitToDashboard("bot:error", { error: error.message })
      process.exit(1)
    }
  }

  async restart() {
    console.log("🔄 Restarting bot...")

    this.emitToDashboard("bot:status", { status: "restarting" })

    if (this.client) {
      await this.client.disconnect()
    }

    this.client = new BaileysClient()

    if (this.isServerMode) {
      this.client.setBotInstance(this)
    }

    await this.client.initialize()

    this.emitToDashboard("bot:status", {
      status: "connected",
      startTime: Date.now(),
      restarted: true,
    })

    console.log("✅ Bot restarted successfully!")
  }

  getStats() {
    return {
      startTime: this.startTime,
      uptime: Date.now() - this.startTime,
      isConnected: this.client?.sock?.user ? true : false,
      connectionState: this.client?.sock?.ws?.readyState || "disconnected",
      user: this.client?.sock?.user || null,
    }
  }

  async sendMessage(jid, message) {
    if (!this.client?.sock) {
      throw new Error("Bot not connected")
    }

    const result = await this.client.sock.sendMessage(jid, { text: message })

    // Emit message sent event
    this.emitToDashboard("message:sent", {
      jid,
      message,
      timestamp: Date.now(),
    })

    return result
  }

  async getMessageCount() {
    if (!this.client?.store?.messages) return 0

    let count = 0
    for (const [jid, chatMessages] of Object.entries(this.client.store.messages)) {
      if (chatMessages && typeof chatMessages === "object") {
        count += Object.keys(chatMessages).length
      }
    }
    return count
  }

  async getUserCount() {
    try {
      const { default: database } = await import("./lib/database.js")
      await database.read()
      return Object.keys(database.data.users || {}).length
    } catch (error) {
      console.error("Error getting user count:", error)
      return 0
    }
  }

  async getGroupCount() {
    try {
      const { default: database } = await import("./lib/database.js")
      await database.read()
      return Object.keys(database.data.groups || {}).length
    } catch (error) {
      console.error("Error getting group count:", error)
      return 0
    }
  }

  async getRecentMessages(limit = 50) {
    if (!this.client?.store?.messages) return []

    try {
      const messages = []
      const store = this.client.store

      for (const [jid, chatMessages] of Object.entries(store.messages)) {
        if (chatMessages && typeof chatMessages === "object") {
          for (const [msgId, msg] of Object.entries(chatMessages)) {
            if (msg && msg.message) {
              messages.push({
                id: msgId,
                jid: jid,
                message: msg.message,
                timestamp: msg.messageTimestamp,
                fromMe: msg.key?.fromMe || false,
              })
            }
          }
        }
      }

      return messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit)
    } catch (error) {
      console.error("Error getting recent messages:", error)
      return []
    }
  }

  isConnected() {
    return this.client?.isConnected || false
  }
}

export const bot = new WhatsAppBot()

process.on("uncaughtException", console.error)
process.on("unhandledRejection", console.error)
