export default {
  name: "add",
  command: ["add", "invite"],
  description: "Add member to group",
  category: "group",
  isGroup: true,
  isAdmin: true,
  isBotAdmin: true,
  cooldown: 5,

  async execute(m, { args, sock }) {
    try {
      if (!args.length) {
        return await m.reply("❌ Please provide phone numbers to add!\n\nExample: !add 628123456789 628987654321")
      }

      const numbers = args.map((arg) => {
        // Clean and format phone number
        let number = arg.replace(/[^0-9]/g, "")

        // Add country code if missing
        if (!number.startsWith("62") && number.startsWith("8")) {
          number = "62" + number
        }

        return number + "@s.whatsapp.net"
      })

      await m.reply("🔄 Adding users to group...")

      try {
        const result = await sock.groupParticipantsUpdate(m.chat, numbers, "add")

        let response = "📊 *Add Users Result:*\n\n"

        for (const [jid, status] of Object.entries(result)) {
          const number = jid.split("@")[0]

          switch (status) {
            case "200":
              response += `✅ @${number} - Successfully added\n`
              break
            case "403":
              response += `❌ @${number} - Privacy settings prevent adding\n`
              break
            case "408":
              response += `⏰ @${number} - Invitation sent (user not on WhatsApp recently)\n`
              break
            case "409":
              response += `ℹ️ @${number} - Already in group\n`
              break
            default:
              response += `❓ @${number} - Unknown status (${status})\n`
          }
        }

        await m.reply(response, { mentions: numbers })
      } catch (error) {
        console.error("Add users error:", error)
        await m.reply("❌ Failed to add users. Make sure the bot has admin permissions and the numbers are valid.")
      }
    } catch (error) {
      console.error("Add command error:", error)
      await m.reply("❌ An error occurred while adding users.")
    }
  },
}
