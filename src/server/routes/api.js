import express from "express";
const router = express.Router()

// Get bot status
router.get("/status", (req, res) => {
  const bot = req.bot
  
  res.json({
    success: true,
    data: {
      isConnected: bot ? bot.isConnected : false,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
  })
})

// Get statistics
router.get("/stats", async (req, res) => {
  try {
    const bot = req.bot
    if (!bot) {
      return res.status(503).json({
        success: false,
        error: "Bot not available",
      })
    }

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
    
    const users = dbData.users || {}
    const groups = dbData.groups || {}
    
    const stats = {
      messages: {
        total: totalMessages || 0,
        today: todayMessages || 0,
      },
      users: {
        total: Object.keys(users).length,
        active: Object.keys(users).length,
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    }

    res.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Stats API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to get statistics",
    })
  }
})

// Send message
router.post("/send-message", async (req, res) => {
  try {
    const { to, message, type = "text" } = req.body
    const bot = req.bot

    if (!bot || !bot.isConnected()) {
      return res.status(503).json({
        success: false,
        error: "Bot not connected",
      })
    }

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: to, message",
      })
    }

    await bot.sendMessage(to, message, type)

    res.json({
      success: true,
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("Send message API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to send message",
    })
  }
})

// Get recent messages
router.get("/messages", async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const bot = req.bot

    if (!bot) {
      return res.status(503).json({
        success: false,
        error: "Bot not available",
      })
    }

    const messages = (await bot.getRecentMessages(Number.parseInt(limit), Number.parseInt(offset))) || []

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("Messages API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to get messages",
    })
  }
})

// Restart bot
router.post("/restart", async (req, res) => {
  try {
    const bot = req.bot

    if (!bot) {
      return res.status(503).json({
        success: false,
        error: "Bot not available",
      })
    }

    await bot.restart()

    res.json({
      success: true,
      message: "Bot restart initiated",
    })
  } catch (error) {
    console.error("Restart API error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to restart bot",
    })
  }
})

// Get QR code
router.get("/qr", (req, res) => {
  const bot = req.bot

  if (!bot) {
    return res.status(503).json({
      success: false,
      error: "Bot not available",
    })
  }

  const qr = bot.getQRCode()

  if (qr) {
    res.json({
      success: true,
      data: { qr },
    })
  } else {
    res.json({
      success: false,
      error: "QR code not available",
    })
  }
})

export default router
