import { bot } from "./main.js"
import { startServer } from "./server/app.js"

// ASCII Art Banner
console.log(`
╭─────────────────────────────────────────╮
│                                         │
│        🤖 WhatsApp Bot v2.0.0           │
│           with Web Dashboard            │
│                                         │
╰─────────────────────────────────────────╯
`)

async function startApplication() {
  try {
    const { server, io } = await startServer(bot)

    bot.setServer(server, io)

    // Start the WhatsApp bot
    await bot.start()

    console.log("✅ Application started successfully!")
    console.log(`🌐 Dashboard available at: http://localhost:${process.env.PORT || 3000}`)
  } catch (error) {
    console.error("❌ Fatal error:", error)
    process.exit(1)
  }
}

startApplication()
