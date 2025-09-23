export default {
  name: "base64",
  command: ["base64", "b64"],
  description: "Encode or decode Base64 text",
  category: "utility",
  cooldown: 3,

  async execute(m, { args }) {
    try {
      if (args.length < 2) {
        return await m.reply(
          "❌ Please specify action and text!\n\nUsage:\n!base64 encode <text>\n!base64 decode <base64>",
        )
      }

      const action = args[0].toLowerCase()
      const text = args.slice(1).join(" ")

      if (!["encode", "decode"].includes(action)) {
        return await m.reply("❌ Invalid action! Use 'encode' or 'decode'.")
      }

      try {
        let result
        let response = `🔐 *Base64 ${action.charAt(0).toUpperCase() + action.slice(1)}*\n\n`

        if (action === "encode") {
          result = Buffer.from(text, "utf8").toString("base64")
          response += `📝 *Original:* ${text}\n`
          response += `🔒 *Encoded:* ${result}`
        } else {
          // Decode
          try {
            result = Buffer.from(text, "base64").toString("utf8")
            response += `🔒 *Encoded:* ${text}\n`
            response += `📝 *Decoded:* ${result}`
          } catch (decodeError) {
            return await m.reply("❌ Invalid Base64 string!")
          }
        }

        await m.reply(response)
      } catch (error) {
        console.error("Base64 operation error:", error)
        await m.reply("❌ Failed to process Base64 operation.")
      }
    } catch (error) {
      console.error("Base64 command error:", error)
      await m.reply("❌ An error occurred while processing Base64.")
    }
  },
}
