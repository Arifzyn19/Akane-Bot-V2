import { bot } from "./main.js";

// ASCII Art Banner
console.log(`
╭─────────────────────────────────────────╮
│                                         │
│        🤖 WhatsApp Bot v1.0.0           │
│        Built with Baileys + MongoDB     │
│                                         │
╰─────────────────────────────────────────╯
`);

// Start the bot
bot.start().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
