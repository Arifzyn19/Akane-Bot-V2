export default {
  name: "translate",
  command: ["translate", "tr", "terjemah"],
  description: "Translate text to different languages",
  category: "utility",
  cooldown: 5,

  async execute(m, { args }) {
    try {
      if (args.length < 2) {
        return await m.reply(
          "❌ Please provide language code and text!\n\nExample: !translate en Halo dunia\n\nCommon codes: en, id, es, fr, de, ja, ko, zh",
        )
      }

      const targetLang = args[0].toLowerCase()
      const text = args.slice(1).join(" ")

      if (text.length > 1000) {
        return await m.reply("❌ Text is too long! Maximum 1000 characters allowed.")
      }

      await m.reply("🌐 Translating text...")

      try {
        // Using Google Translate API (unofficial)
        const response = await fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
        )

        if (!response.ok) {
          throw new Error(`Translation API Error: ${response.status}`)
        }

        const data = await response.json()

        if (!data || !data[0] || !data[0][0]) {
          throw new Error("Invalid translation response")
        }

        const translatedText = data[0][0][0]
        const detectedLang = data[2] || "unknown"

        let result = `🌐 *Translation Result*\n\n`
        result += `🔤 *Original (${detectedLang}):* ${text}\n`
        result += `✅ *Translated (${targetLang}):* ${translatedText}`

        await m.reply(result)
      } catch (error) {
        console.error("Translation error:", error)
        await m.reply("❌ Failed to translate text. Please check the language code and try again.")
      }
    } catch (error) {
      console.error("Translate command error:", error)
      await m.reply("❌ An error occurred while translating the text.")
    }
  },
}
