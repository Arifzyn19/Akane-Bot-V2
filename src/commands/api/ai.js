export default {
  name: "ai",
  command: ["ai", "gpt", "ask"],
  description: "Chat with AI assistant",
  category: "api",
  cooldown: 10,

  async execute(m, { args }) {
    try {
      if (!args.length) {
        return await m.reply(
          "❌ Please provide a question or message!\n\nExample: !ai What is the capital of Indonesia?",
        )
      }

      const question = args.join(" ")

      if (question.length > 500) {
        return await m.reply("❌ Question is too long! Maximum 500 characters allowed.")
      }

      await m.reply("🤖 AI is thinking...")

      try {
        // Using a free AI API (you can replace with your preferred service)
        const apiKey = process.env.OPENAI_API_KEY

        if (!apiKey) {
          // Fallback to a free service
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "You are a helpful assistant. Keep responses concise and informative.",
                },
                {
                  role: "user",
                  content: question,
                },
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          })

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`)
          }

          const data = await response.json()
          const answer = data.choices[0].message.content.trim()

          let result = `🤖 *AI Assistant*\n\n`
          result += `❓ *Question:* ${question}\n\n`
          result += `💭 *Answer:* ${answer}`

          await m.reply(result)
        } else {
          return await m.reply("❌ AI service is not configured. Please set OPENAI_API_KEY in environment variables.")
        }
      } catch (error) {
        console.error("AI API error:", error)
        await m.reply("❌ Failed to get AI response. Please try again later.")
      }
    } catch (error) {
      console.error("AI command error:", error)
      await m.reply("❌ An error occurred while processing AI request.")
    }
  },
}
