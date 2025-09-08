export default {
  name: "ping",
  description: "Check bot response time",
  usage: "!ping",
  category: "general",
  aliases: ["p"],
  permissions: ["user"],
  cooldown: 3,

  execute: async (sock, { msg }) => {
    const start = Date.now();

    const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
      text: "🏓 Pinging...",
    });

    const end = Date.now();
    const latency = end - start;

    // Edit the message with ping result
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🏓 *Pong!*\n⚡ Latency: ${latency}ms`,
    });
  },
};
