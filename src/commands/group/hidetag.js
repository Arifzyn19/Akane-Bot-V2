export default {
  name: "hidetag",
  command: ["hidetag", "ht"],
  description: "Send message with hidden mentions to all members",
  category: "group",
  isGroup: true,
  isAdmin: true,
  cooldown: 15,

  async execute(m, { args, sock }) {
    try {
      if (!args.length) {
        return await m.reply("❌ Please provide a message to send!\n\nExample: !hidetag Hello everyone!")
      }

      const message = args.join(" ")
      const groupMetadata = await sock.groupMetadata(m.chat)
      const participants = groupMetadata.participants.map((p) => p.id)

      if (participants.length === 0) {
        return await m.reply("❌ No members found in this group!")
      }

      // Send message with hidden mentions
      await sock.sendMessage(
        m.chat,
        {
          text: message,
          mentions: participants,
        },
        { quoted: m },
      )
    } catch (error) {
      console.error("HideTag command error:", error)
      await m.reply("❌ An error occurred while sending hidden tag message.")
    }
  },
}
