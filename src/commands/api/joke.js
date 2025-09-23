export default {
  name: "joke",
  command: ["joke", "jokes", "lucu"],
  description: "Get random jokes",
  category: "api",
  cooldown: 5,

  async execute(m, { args }) {
    try {
      const category = args[0] || "any"
      const validCategories = ["programming", "misc", "dark", "pun", "spooky", "christmas", "any"]

      await m.reply("😄 Getting a joke for you...")

      try {
        // Using JokeAPI (free, no key required)
        const apiUrl = `https://v2.jokeapi.dev/joke/${category}?blacklistFlags=nsfw,religious,political,racist,sexist,explicit`

        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error(`Joke API Error: ${response.status}`)
        }

        const data = await response.json()

        let joke = `😄 *Random Joke*\n\n`

        if (data.type === "single") {
          joke += `${data.joke}\n\n`
        } else {
          joke += `${data.setup}\n\n`
          joke += `💡 *Punchline:* ${data.delivery}\n\n`
        }

        joke += `🏷️ *Category:* ${data.category}\n`
        joke += `🆔 *ID:* ${data.id}`

        await m.reply(joke)
      } catch (error) {
        console.error("Joke API error:", error)

        // Fallback jokes
        const fallbackJokes = [
          "Why don't scientists trust atoms? Because they make up everything!",
          "Why did the scarecrow win an award? He was outstanding in his field!",
          "Why don't eggs tell jokes? They'd crack each other up!",
          "What do you call a fake noodle? An impasta!",
          "Why did the math book look so sad? Because it had too many problems!",
        ]

        const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)]

        let joke = `😄 *Random Joke*\n\n`
        joke += `${randomJoke}`

        await m.reply(joke)
      }
    } catch (error) {
      console.error("Joke command error:", error)
      await m.reply("❌ An error occurred while getting joke.")
    }
  },
}
