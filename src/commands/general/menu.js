import { ENV } from "../../config/env.js";
import { plugins } from "../../lib/plugin.js";
import Function from "../../lib/function.js";

export default {
  name: "menu",
  description: "Show available commands",
  command: ["menu", "help"],
  usage: "!menu [category]",
  category: "general",
  aliases: ["help", "h"],
  permissions: ["all"],

  execute: async (m, { sock, args }) => {
    const requestedCategory = args[0]?.toLowerCase();
    const commands = Object.values(plugins);
    
    const categories = {};
    commands.forEach((cmd) => {
      const category = cmd.category || "general";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd);
    });

    let menuText = `╭─「 *Akane Bot* 」\n`;
    menuText += `│ 👋 Hello, ${m.pushName || "User"}!\n`;
    menuText += `│ ⚡ Uptime: ${Function.formatUptime(process.uptime())}\n`;
    menuText += `│ 📱 Prefix: ${m.prefix}\n`;
    menuText += `│ 🤖 Enhanced Client: ✅\n`;
    menuText += `╰────────────────\n\n`;

    if (requestedCategory) { 
      if (categories[requestedCategory]) {
        menuText += `╭─「 *${requestedCategory.toUpperCase()}* 」\n`;
        categories[requestedCategory].forEach((cmd) => {
          const aliases = cmd.aliases ? ` (${cmd.aliases.join(", ")})` : "";
          const commandName = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;
          const prefix = cmd.prefix === false ? '' : m.prefix;
          menuText += `│ ${prefix}${commandName}${aliases}\n`;
          menuText += `│   ${cmd.description || "No description"}\n`;
          if (cmd.usage) menuText += `│   📖 ${cmd.usage}\n`;
          if (cmd.cooldown) menuText += `│   ⏱️ Cooldown: ${cmd.cooldown}s\n`;
        });
        menuText += `╰────────────────\n`;
      } else {
        menuText += `❌ Category *${requestedCategory}* not found.\n\n`;
        menuText += `Available categories:\n${Object.keys(categories)
          .map((cat) => `• ${cat}`)
          .join("\n")}`;
      }
    } else {
      Object.keys(categories)
        .sort()
        .forEach((category) => {
          menuText += `╭─「 *${category.toUpperCase()}* 」\n`;
          categories[category].forEach((cmd) => {
            const commandName = Array.isArray(cmd.command) ? cmd.command[0] : cmd.command;
            const prefix = cmd.prefix === false ? '' : m.prefix;
            menuText += `│ ${prefix}${commandName} - ${cmd.description || "No description"}\n`;
          });
          menuText += `╰────────────────\n\n`;
        });
        
      menuText += `🔧 *Tips:*\n`;
      menuText += `• Use ${m.prefix}menu <category> for detailed info\n`;
      menuText += `• Commands may have cooldowns\n`;
      menuText += `• Some commands require special permissions\n`;
      menuText += `• Try ${m.prefix}test to check client features`;
    }

    await m.reply(menuText);
    await m.react("📋");
  },
};
