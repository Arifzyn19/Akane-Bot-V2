export default {
  name: "shorturl",
  command: ["shorturl", "short", "tinyurl"],
  description: "Shorten long URLs",
  category: "utility",
  cooldown: 5,

  async execute(m, { args }) {
    try {
      if (!args.length) {
        return await m.reply(
          "❌ Please provide a URL to shorten!\n\nExample: !shorturl https://example.com/very/long/url",
        )
      }

      const url = args[0]

      // Basic URL validation
      try {
        new URL(url)
      } catch {
        return await m.reply("❌ Please provide a valid URL!")
      }

      await m.reply("🔗 Shortening URL...")

      try {
        // Using TinyURL API (free, no key required)
        const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`)

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }

        const shortUrl = await response.text()

        if (shortUrl.includes("Error")) {
          throw new Error("URL shortening failed")
        }

        let result = `🔗 *URL Shortened Successfully*\n\n`
        result += `📎 *Original:* ${url}\n`
        result += `✂️ *Shortened:* ${shortUrl}\n`
        result += `📊 *Saved:* ${url.length - shortUrl.length} characters`

        await m.reply(result)
      } catch (error) {
        console.error("URL shortening error:", error)
        await m.reply("❌ Failed to shorten URL. Please try again later.")
      }
    } catch (error) {
      console.error("ShortURL command error:", error)
      await m.reply("❌ An error occurred while shortening the URL.")
    }
  },
}
