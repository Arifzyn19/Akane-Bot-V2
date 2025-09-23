import express from "express"
const router = express.Router()

// Dashboard home
router.get("/", async (req, res) => {
  try {
    const bot = req.bot
    const stats = await getStats(bot)

    res.render("dashboard/index", {
      title: "Dashboard",
      user: req.session.user,
      stats: stats,
      botStatus: bot ? bot.isConnected() : false,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.render("dashboard/index", {
      title: "Dashboard",
      user: req.session.user,
      stats: {},
      botStatus: false,
      error: "Failed to load dashboard data",
    })
  }
})

// Bot management page
router.get("/bot", (req, res) => {
  const bot = req.bot

  res.render("dashboard/bot", {
    title: "Bot Management",
    user: req.session.user,
    botStatus: bot ? bot.isConnected() : false,
    botInfo: bot ? bot.getInfo : null,
  })
})

// Messages page
router.get("/messages", async (req, res) => {
  try {
    const bot = req.bot
    const messages = await getRecentMessages(bot)

    res.render("dashboard/messages", {
      title: "Messages",
      user: req.session.user,
      messages: messages,
    })
  } catch (error) {
    console.error("Messages error:", error)
    res.render("dashboard/messages", {
      title: "Messages",
      user: req.session.user,
      messages: [],
      error: "Failed to load messages",
    })
  }
})

// Settings page
router.get("/settings", (req, res) => {
  res.render("dashboard/settings", {
    title: "Settings",
    user: req.session.user,
    config: process.env,
  })
})

// Statistics page
router.get("/statistics", async (req, res) => {
  try {
    const bot = req.bot
    const stats = await getDetailedStats(bot)

    res.render("dashboard/statistics", {
      title: "Statistics",
      user: req.session.user,
      stats: stats,
    })
  } catch (error) {
    console.error("Statistics error:", error)
    res.render("dashboard/statistics", {
      title: "Statistics",
      user: req.session.user,
      stats: {},
      error: "Failed to load statistics",
    })
  }
})

// Helper functions
async function getStats(bot) {
  if (!bot) return {}

  try {
    const database = (await import("../../lib/database.js")).default
    await database.read()

    const messageCount = bot.client?.store ? Object.keys(bot.client.store.messages || {}).length : 0
    const userCount = Object.keys(database.data.users || {}).length
    const groupCount = Object.keys(database.data.groups || {}).length

    return {
      totalMessages: messageCount,
      activeUsers: userCount,
      totalGroups: groupCount,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      isConnected: bot.client?.isConnected || false,
    }
  } catch (error) {
    console.error("Error getting stats:", error)
    return {}
  }
}

async function getRecentMessages(bot, limit = 50) {
  if (!bot?.client?.store) return []

  try {
    const messages = []
    const store = bot.client.store

    // Get messages from store
    if (store.messages) {
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
    }

    // Sort by timestamp and limit
    return messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, limit)
  } catch (error) {
    console.error("Error getting recent messages:", error)
    return []
  }
}

async function getDetailedStats(bot) {
  if (!bot) return {}

  try {
    const database = (await import("../../lib/database.js")).default
    await database.read()

    const store = bot.client?.store
    const dbData = database.data

    // Get message stats from store
    let totalMessages = 0
    let todayMessages = 0
    const today = new Date().toDateString()

    if (store?.messages) {
      for (const [jid, chatMessages] of Object.entries(store.messages)) {
        if (chatMessages && typeof chatMessages === "object") {
          for (const [msgId, msg] of Object.entries(chatMessages)) {
            if (msg && msg.message) {
              totalMessages++
              const msgDate = new Date((msg.messageTimestamp || 0) * 1000).toDateString()
              if (msgDate === today) {
                todayMessages++
              }
            }
          }
        }
      }
    }

    // Get user stats from database
    const users = dbData.users || {}
    const groups = dbData.groups || {}

    return {
      messages: {
        total: totalMessages,
        today: todayMessages,
        thisWeek: totalMessages, // Simplified for now
      },
      users: {
        total: Object.keys(users).length,
        active: Object.keys(users).length, // Simplified for now
        new: 0, // Simplified for now
      },
      commands: dbData.stats || {},
      groups: {
        total: Object.keys(groups).length,
        active: Object.keys(groups).length,
      },
    }
  } catch (error) {
    console.error("Error getting detailed stats:", error)
    return {}
  }
}

export default router