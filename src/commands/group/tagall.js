export default {
  name: "tagall",
  command: ["tagall", "everyone", "all"],
  description: "Mention all group members",
  category: "group",
  isGroup: true,
  isAdmin: true,
  cooldown: 30,

  async execute(m, { args, sock }) {
    try {
      const groupMetadata = await sock.groupMetadata(m.chat)
      const participants = groupMetadata.participants

      if (participants.length === 0) {
        return await m.reply("❌ No members found in this group!")
      }

      const message = args.length > 0 ? args.join(" ") : "📢 Attention everyone!"

      let text = `${message}\n\n`
      text += `👥 *Total Members:* ${participants.length}\n\n`

      // Add all participants as mentions
      const mentions = participants.map((p) => p.id)

      // Create mention text
      participants.forEach((participant, index) => {
        const number = participant.id.split("@")[0]
        text += `${index + 1}. @${number}\n`
      })

      text += `\n⏰ *Tagged at:* ${new Date().toLocaleString()}`

      await sock.sendMessage(
        m.chat,
        {
          text: text,
          mentions: mentions,
        },
        { quoted: m },
      )
    } catch (error) {
      console.error("TagAll command error:", error)
      await m.reply("❌ An error occurred while tagging all members.")
    }
  },
}
