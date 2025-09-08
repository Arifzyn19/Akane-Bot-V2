export default {
  name: "ping",
  description: "Check bot response time",
  command: ["ping"],
  usage: "!ping",
  category: "general",
  aliases: ["p"],
  permissions: "all",
  //cooldown: 3,

  execute: async (sock, { m }) => {
    const start = Date.now();

    const sentMsg = await sock.sendMessage(m.chat, {
      text: "🏓 Pinging...",
    });

    const end = Date.now();
    const latency = end - start;

    await sock.sendMessage(m.chat, {
      text: `🏓 *Pong!*\n⚡ Latency: ${latency}ms`,
      edit: sentMsg.key,  
    });
  },
};
