export default {
  name: "groupinfo",
  command: ["groupinfo", "gcinfo", "infogroup"],
  description: "Get detailed group information",
  category: "group",
  isGroup: true,
  cooldown: 5,

  async execute(m, { sock }) {
    try {
      await m.reply("🔍 Getting group information...")

      try {
        const groupMetadata = await sock.groupMetadata(m.chat)

        const totalMembers = groupMetadata.participants.length
        const admins = groupMetadata.participants.filter((p) => p.admin === "admin")
        const superAdmins = groupMetadata.participants.filter((p) => p.admin === "superadmin")
        const members = groupMetadata.participants.filter((p) => p.admin === null)

        let info = `📊 *Group Information*\n\n`
        info += `🏷️ *Name:* ${groupMetadata.subject}\n`
        info += `🆔 *ID:* ${groupMetadata.id}\n`
        info += `👥 *Total Members:* ${totalMembers}\n`
        info += `👑 *Super Admins:* ${superAdmins.length}\n`
        info += `🛡️ *Admins:* ${admins.length}\n`
        info += `👤 *Members:* ${members.length}\n`

        if (groupMetadata.desc) {
          info += `📝 *Description:* ${groupMetadata.desc}\n`
        }

        if (groupMetadata.creation) {
          const creationDate = new Date(groupMetadata.creation * 1000)
          info += `📅 *Created:* ${creationDate.toLocaleDateString()}\n`
        }

        // Group settings
        info += `\n⚙️ *Settings:*\n`
        info += `🔒 *Only Admins Can Edit:* ${groupMetadata.restrict ? "Yes" : "No"}\n`
        info += `💬 *Only Admins Can Send:* ${groupMetadata.announce ? "Yes" : "No"}\n`

        // Owner info
        if (groupMetadata.owner) {
          const ownerNumber = groupMetadata.owner.split("@")[0]
          info += `\n👑 *Owner:* @${ownerNumber}`
        }

        await m.reply(info, {
          mentions: groupMetadata.owner ? [groupMetadata.owner] : [],
        })
      } catch (error) {
        console.error("Group metadata error:", error)
        await m.reply("❌ Failed to get group information.")
      }
    } catch (error) {
      console.error("GroupInfo command error:", error)
      await m.reply("❌ An error occurred while getting group information.")
    }
  },
}
