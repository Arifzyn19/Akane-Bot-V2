import QRCode from "qrcode"

export default {
  name: "qr",
  command: ["qr", "qrcode"],
  description: "Generate QR code from text",
  category: "utility",
  cooldown: 5,

  async execute(m, { args, sock }) {
    try {
      if (!args.length) {
        return await m.reply("❌ Please provide text to generate QR code!\n\nExample: !qr Hello World")
      }

      const text = args.join(" ")

      if (text.length > 500) {
        return await m.reply("❌ Text is too long! Maximum 500 characters allowed.")
      }

      await m.reply("🔄 Generating QR code...")

      try {
        const qrBuffer = await QRCode.toBuffer(text, {
          type: "png",
          width: 512,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        })

        await sock.sendMessage(
          m.chat,
          {
            image: qrBuffer,
            caption: `📱 *QR Code Generated*\n\n💬 *Text:* ${text}\n📏 *Length:* ${text.length} characters`,
          },
          { quoted: m },
        )
      } catch (error) {
        console.error("QR generation error:", error)
        await m.reply("❌ Failed to generate QR code. Please try again.")
      }
    } catch (error) {
      console.error("QR command error:", error)
      await m.reply("❌ An error occurred while generating QR code.")
    }
  },
}
