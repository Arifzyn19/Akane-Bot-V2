export default {
  name: "promote",
  command: ["promote", "admin"],
  description: "Promote member to admin",
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
        return await m.reply(
          "❌ Please mention users or reply to a message to promote!\n\nExample: !promote @user1 @user2",
        )
      }

      // Check if users are already admins
      const groupMetadata = await sock.groupMetadata(m.chat)
      const groupAdmins = groupMetadata.participants.filter((p) => p.admin !== null).map((p) => p.id)

      const validUsers = users.filter((user) => !groupAdmins.includes(user))

      if (validUsers.length === 0) {
        return await m.reply("❌ Selected users are already admins!")
      }

      try {
        await sock.groupParticipantsUpdate(m.chat, validUsers, "promote")

        const promotedUsers = validUsers.map((user) => `@${user.split("@")[0]}`).join(", ")
        await m.reply(`✅ Successfully promoted to admin: ${promotedUsers}`, { mentions: validUsers })
      } catch (error) {
        console.error("Promote error:", error)
        await m.reply("❌ Failed to promote users. Make sure the bot has admin permissions.")
      }
    } catch (error) {
      console.error("Promote command error:", error)
      await m.reply("❌ An error occurred while promoting users.")
    }
  },
}
