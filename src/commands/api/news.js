export default {
  name: "news",
  command: ["news", "berita"],
  description: "Get latest news headlines",
  category: "api",
  cooldown: 15,

  async execute(m, { args }) {
    try {
      const category = args[0] || "general"
      const validCategories = ["general", "business", "entertainment", "health", "science", "sports", "technology"]

      if (!validCategories.includes(category.toLowerCase())) {
        return await m.reply(
          `❌ Invalid category! Available categories:\n${validCategories.join(", ")}\n\nExample: !news technology`,
        )
      }

      await m.reply("📰 Getting latest news...")

      try {
        const apiKey = process.env.NEWS_API_KEY

        if (!apiKey) {
          return await m.reply("❌ News service is not configured. Please set NEWS_API_KEY in environment variables.")
        }

        const response = await fetch(
          `https://newsapi.org/v2/top-headlines?category=${category.toLowerCase()}&country=us&pageSize=5&apiKey=${apiKey}`,
        )

        if (!response.ok) {
          throw new Error(`News API Error: ${response.status}`)
        }

        const data = await response.json()

        if (!data.articles || data.articles.length === 0) {
          return await m.reply("❌ No news articles found for this category.")
        }

        let news = `📰 *Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News*\n\n`

        data.articles.slice(0, 5).forEach((article, index) => {
          news += `${index + 1}. *${article.title}*\n`
          if (article.description) {
            news += `📝 ${article.description.substring(0, 100)}...\n`
          }
          news += `🔗 ${article.url}\n`
          news += `📅 ${new Date(article.publishedAt).toLocaleDateString()}\n\n`
        })

        news += `⏰ *Updated:* ${new Date().toLocaleString()}`

        await m.reply(news)
      } catch (error) {
        console.error("News API error:", error)
        await m.reply("❌ Failed to get news. Please try again later.")
      }
    } catch (error) {
      console.error("News command error:", error)
      await m.reply("❌ An error occurred while getting news.")
    }
  },
}
