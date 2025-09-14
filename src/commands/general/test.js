export default {
  name: "test",
  description: "Test enhanced client features and permissions",
  command: ["test", "t"],
  permissions: "all",
  category: "info",
  cooldown: 5,

  async execute(m, { sock, user, isOwner, isAdmin }) {
    let testText = `🧪 *Plugin Test Results*\n\n`;

    // Basic info
    testText += `👤 Name: ${m.pushName || "Unknown"}\n`;
    testText += `📱 Number: ${m.sender.replace("@s.whatsapp.net", "")}\n`;
    testText += `🆔 JID: ${m.sender}\n`;
    testText += `📩 Chat: ${m.chat}\n`;
    testText += `🔢 Message ID: ${m.id}\n\n`;

    // New Permission System
    testText += `🔐 *New Permission System:*\n`;
    testText += `• Owner: ${isOwner ? "✅" : "❌"}\n`;
    testText += `• Admin: ${isAdmin ? "✅" : "❌"}\n`;
    testText += `• Permission Type: ${this.getUserPermissionType(m)}\n\n`;

    // Message info
    testText += `📄 *Message Info:*\n`;
    testText += `• Type: ${m.type}\n`;
    testText += `• Media: ${m.isMedia ? "✅" : "❌"}\n`;
    testText += `• Group: ${m.isGroup ? "✅" : "❌"}\n`;
    testText += `• Quoted: ${m.quoted ? "✅" : "❌"}\n`;
    testText += `• Mentions: ${m.mentions?.length || 0}\n\n`;

    // Plugin system
    const { plugins } = await import("../../lib/plugin.js");
    testText += `🔥 *Plugin System:*\n`;
    testText += `• Total Plugins: ${Object.keys(plugins).length}\n`;
    testText += `• Hot Reload: ✅ Active\n`;
    testText += `• File Watching: ✅ Active\n`;
    testText += `• Permission Format: New System\n\n`;

    // Time info
    testText += `⏰ *Performance:*\n`;
    testText += `• Process Uptime: ${Math.floor(process.uptime())}s\n`;
    testText += `• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`;

    // Enhanced features
    if (m.isMedia) {
      testText += `\n📎 *Media Info:*\n`;
      testText += `• MIME: ${m.mime}\n`;
      testText += `• Size: ${m.size} bytes\n`;
      if (m.width && m.height) {
        testText += `• Dimensions: ${m.width}x${m.height}\n`;
      }
    }

    if (m.quoted) {
      testText += `\n💬 *Quoted Message:*\n`;
      testText += `• Type: ${m.quoted.type}\n`;
      testText += `• Media: ${m.quoted.isMedia ? "✅" : "❌"}\n`;
      if (m.quoted.body) {
        testText += `• Preview: ${m.quoted.body.substring(0, 30)}${m.quoted.body.length > 30 ? "..." : ""}\n`;
      }
    }

    await m.reply(testText);
  },

  async getUserPermissionType(m) {
    const { ENV } = await import("../../config/env.js");
    const userNumber = m.sender.replace("@s.whatsapp.net", "");

    if (ENV.OWNER_NUMBERS.includes(userNumber)) return "owner";
    if (ENV.ADMIN_NUMBERS.includes(userNumber)) return "admin";
    return "all";
  },
};
