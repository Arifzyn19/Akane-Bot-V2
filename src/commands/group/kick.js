export default {
  name: "kick",
  command: ["kick", "remove"],
  description: "Remove member from group",
  category: "group",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 5,

  async execute(m, { sock }) {
    try {
      let users = []

      // Get users from mentions or quoted message
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        users = m.mentionedJid
      } else if (m.quoted && m.quoted.sender) {
        users = [m.quoted.sender]
      } else {
        return await m.reply("❌ Please mention users or reply to a message to kick!\n\nExample: !kick @user1 @user2")
      }

      // Filter out bot and admins
      const groupMetadata = await sock.groupMetadata(m.chat)
      const groupAdmins = groupMetadata.participants.filter((p) => p.admin !== null).map((p) => p.id)

      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net"

      const validUsers = users.filter((user) => {
        if (user === botNumber) return false
        if (groupAdmins.includes(user)) return false
        return true
      })

      if (validUsers.length === 0) {
        return await m.reply("❌ Cannot kick admins or the bot!")
      }

      try {
        await sock.groupParticipantsUpdate(m.chat, validUsers, "remove")

        const kickedUsers = validUsers.map((user) => `@${user.split("@")[0]}`).join(", ")
        await m.reply(`✅ Successfully removed: ${kickedUsers}`, { mentions: validUsers })
      } catch (error) {
        console.error("Kick error:", error)
        await m.reply("❌ Failed to remove users. Make sure the bot has admin permissions.")
      }
    } catch (error) {
      console.error("Kick command error:", error)
      await m.reply("❌ An error occurred while removing users.")
    }
  },
}
