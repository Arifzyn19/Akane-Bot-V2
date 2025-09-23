export default {
  name: "quote",
  command: ["quote", "quotes", "inspirasi"],
  description: "Get inspirational quotes",
  category: "api",
  cooldown: 5,

  async execute(m, { args }) {
    try {
      const category = args[0] || "inspirational"

      await m.reply("💭 Getting inspirational quote...")

      try {
        // Using quotable.io API (free, no key required)
        let apiUrl = "https://api.quotable.io/random"

        if (category && category !== "random") {
          apiUrl += `?tags=${encodeURIComponent(category)}`
        }

        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`Quote API Error: ${response.status}`)
        }

        const data = await response.json()

        let quote = `💭 *Inspirational Quote*\n\n`
        quote += `"${data.content}"\n\n`
        quote += `👤 *Author:* ${data.author}\n`

        if (data.tags && data.tags.length > 0) {
          quote += `🏷️ *Tags:* ${data.tags.join(", ")}\n`
        }

        quote += `📏 *Length:* ${data.length} characters`

        await m.reply(quote)
      } catch (error) {
        console.error("Quote API error:", error)

        // Fallback quotes
        const fallbackQuotes = [
          { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
          { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
          { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
          {
            content: "The future belongs to those who believe in the beauty of their dreams.",
            author: "Eleanor Roosevelt",
          },
          { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
        ]

        const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]

        let quote = `💭 *Inspirational Quote*\n\n`
        quote += `"${randomQuote.content}"\n\n`
        quote += `👤 *Author:* ${randomQuote.author}`

        await m.reply(quote)
      }
    } catch (error) {
      console.error("Quote command error:", error)
      await m.reply("❌ An error occurred while getting quote.")
    }
  },
}
