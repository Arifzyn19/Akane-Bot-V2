import { formatUptime, hasPermission } from '../../lib/utils.js';

export default {
  name: "menu",
  description: "Show available commands",
  command: ["menu", "help"],
  usage: "!menu [category]",
  category: "general",
  aliases: ["help", "h"],
  permissions: ["all"],

  execute: async (sock, { msg, args, user, bot, commands, pushName }) => {
    const requestedCategory = args[0]?.toLowerCase();
    
    // Group commands by category
    const categories = {};
    commands.forEach(cmd => {
      // Filter commands based on user permissions
      if (cmd.permissions && !hasPermission(user.permissions, cmd.permissions)) {
        return;
      }
      
      const category = cmd.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(cmd);
    });

    let menuText = `╭─「 *${bot.name}* 」\n`;
    menuText += `│ 👋 Hello, ${pushName || 'User'}!\n`;
    menuText += `│ ⚡ Uptime: ${formatUptime(process.uptime())}\n`;
    menuText += `│ 📱 Prefix: ${bot.prefix}\n`;
    menuText += `│ 👤 Role: ${user.permissions.join(', ')}\n`;
    menuText += `│ 🤖 Enhanced Client: ✅\n`;
    menuText += `╰────────────────\n\n`;

    if (requestedCategory) {
      // Show specific category
      if (categories[requestedCategory]) {
        menuText += `╭─「 *${requestedCategory.toUpperCase()}* 」\n`;
        categories[requestedCategory].forEach(cmd => {
          const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
          menuText += `│ ${bot.prefix}${cmd.name}${aliases}\n`;
          menuText += `│   ${cmd.description || 'No description'}\n`;
          if (cmd.usage) menuText += `│   📖 ${cmd.usage}\n`;
        });
        menuText += `╰────────────────\n`;
      } else {
        menuText += `❌ Category *${requestedCategory}* not found.\n\n`;
        menuText += `Available categories:\n${Object.keys(categories).map(cat => `• ${cat}`).join('\n')}`;
      }
    } else {
      // Show all categories
      Object.keys(categories).sort().forEach(category => {
        menuText += `╭─「 *${category.toUpperCase()}* 」\n`;
        categories[category].forEach(cmd => {
          menuText += `│ ${bot.prefix}${cmd.name} - ${cmd.description || 'No description'}\n`;
        });
        menuText += `╰────────────────\n\n`;
      });
      
      menuText += `💡 *Enhanced Features:*\n`;
      menuText += `• Advanced message handling\n`;
      menuText += `• Media download & processing\n`;
      menuText += `• Poll creation in groups\n`;
      menuText += `• Reaction support\n`;
      menuText += `• Enhanced permissions\n\n`;
      
      menuText += `🔧 *Tips:*\n`;
      menuText += `• Use ${bot.prefix}menu <category> for detailed info\n`;
      menuText += `• Commands may have cooldowns\n`;
      menuText += `• Some commands require special permissions\n`;
      menuText += `• Try ${bot.prefix}test to check client features`;
    }

    await msg.reply(menuText);
    await msg.react('📋');
  }
};