import { fileTypeFromBuffer } from "file-type"

export default {
  name: "mediainfo",
  command: ["mediainfo", "info", "fileinfo"],
  description: "Get detailed information about media files",
  category: "media",
  cooldown: 3,
  isQuoted: true,

  async execute(m, { sock }) {
    try {
      const quoted = m.quoted

      if (!quoted) {
        return await m.reply("❌ Please reply to a media message!")
      }

      const mediaTypes = ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"]

      if (!mediaTypes.includes(quoted.mtype)) {
        return await m.reply("❌ Please reply to a media message!")
      }

      await m.reply("🔍 Analyzing media...")

      try {
        const media = await quoted.download()
        const fileType = await fileTypeFromBuffer(media)

        let info = "📊 *Media Information*\n\n"
        info += `🏷️ *Type:* ${quoted.mtype.replace("Message", "")}\n`
        info += `📏 *Size:* ${(media.length / 1024 / 1024).toFixed(2)} MB\n`
        info += `📦 *Bytes:* ${media.length.toLocaleString()}\n`

        if (fileType) {
          info += `🎯 *MIME Type:* ${fileType.mime}\n`
          info += `📝 *Extension:* .${fileType.ext}\n`
        }

        // Additional info based on message type
        if (quoted.msg) {
          const msg = quoted.msg

          if (msg.width && msg.height) {
            info += `📐 *Dimensions:* ${msg.width}x${msg.height}\n`
          }

          if (msg.seconds) {
            const duration = Math.floor(msg.seconds)
            const minutes = Math.floor(duration / 60)
            const seconds = duration % 60
            info += `⏱️ *Duration:* ${minutes}:${seconds.toString().padStart(2, "0")}\n`
          }

          if (msg.fileName) {
            info += `📄 *File Name:* ${msg.fileName}\n`
          }

          if (msg.caption) {
            info += `💬 *Caption:* ${msg.caption}\n`
          }
        }

        info += `\n⏰ *Analyzed at:* ${new Date().toLocaleString()}`

        await m.reply(info)
      } catch (error) {
        console.error("Media info error:", error)
        await m.reply("❌ Failed to analyze media information.")
      }
    } catch (error) {
      console.error("MediaInfo command error:", error)
      await m.reply("❌ An error occurred while analyzing the media.")
    }
  },
}
