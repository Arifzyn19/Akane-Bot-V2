import express from "express"
const router = express.Router()

// Bot control actions
router.post("/action/:action", async (req, res) => {
  try {
    const { action } = req.params
    const bot = req.bot

    if (!bot) {
      return res.status(503).json({
        success: false,
        error: "Bot not available",
      })
    }

    let result

    switch (action) {
      case "start":
        result = await bot.start()
        break

      case "stop":
        result = await bot.stop()
        break

      case "restart":
        result = await bot.restart()
        break

      case "reload-plugins":
        result = await bot.reloadPlugins()
        break

      default:
        return res.status(400).json({
          success: false,
          error: "Invalid action",
        })
    }

    res.json({
      success: true,
      message: `Bot ${action} completed`,
      data: result,
    })
  } catch (error) {
    console.error(`Bot ${req.params.action} error:`, error)
    res.status(500).json({
      success: false,
      error: `Failed to ${req.params.action} bot`,
    })
  }
})

// Get bot configuration
router.get("/config", (req, res) => {
  const config = {
    botName: process.env.BOT_NAME,
    prefix: process.env.PREFIX,
    autoReconnect: process.env.AUTO_RECONNECT,
    logLevel: process.env.LOG_LEVEL,
    commandsDir: process.env.COMMANDS_DIR,
  }

  res.json({
    success: true,
    data: config,
  })
})

// Update bot configuration
router.post("/config", (req, res) => {
  try {
    const { config } = req.body

    // Update environment variables (in production, save to file or database)
    Object.keys(config).forEach((key) => {
      if (config[key] !== undefined) {
        process.env[key.toUpperCase()] = config[key]
      }
    })

    res.json({
      success: true,
      message: "Configuration updated successfully",
    })
  } catch (error) {
    console.error("Config update error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to update configuration",
    })
  }
})

export default router