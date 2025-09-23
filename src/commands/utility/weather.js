export default {
  name: "weather",
  command: ["weather", "cuaca"],
  description: "Get weather information for a city",
  category: "utility",
  cooldown: 10,

  async execute(m, { args }) {
    try {
      if (!args.length) {
        return await m.reply("❌ Please provide a city name!\n\nExample: !weather Jakarta")
      }

      const city = args.join(" ")
      await m.reply("🌤️ Getting weather information...")

      try {
        // Using OpenWeatherMap API (free tier)
        const apiKey = process.env.OPENWEATHER_API_KEY

        if (!apiKey) {
          return await m.reply(
            "❌ Weather service is not configured. Please set OPENWEATHER_API_KEY in environment variables.",
          )
        }

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
        )

        if (!response.ok) {
          if (response.status === 404) {
            return await m.reply(`❌ City "${city}" not found. Please check the spelling.`)
          }
          throw new Error(`API Error: ${response.status}`)
        }

        const data = await response.json()

        let weather = `🌤️ *Weather Information*\n\n`
        weather += `📍 *Location:* ${data.name}, ${data.sys.country}\n`
        weather += `🌡️ *Temperature:* ${data.main.temp}°C (feels like ${data.main.feels_like}°C)\n`
        weather += `📊 *Condition:* ${data.weather[0].main} - ${data.weather[0].description}\n`
        weather += `💧 *Humidity:* ${data.main.humidity}%\n`
        weather += `💨 *Wind Speed:* ${data.wind.speed} m/s\n`
        weather += `🔽 *Pressure:* ${data.main.pressure} hPa\n`

        if (data.visibility) {
          weather += `👁️ *Visibility:* ${(data.visibility / 1000).toFixed(1)} km\n`
        }

        weather += `\n⏰ *Updated:* ${new Date().toLocaleString()}`

        await m.reply(weather)
      } catch (error) {
        console.error("Weather API error:", error)
        await m.reply("❌ Failed to get weather information. Please try again later.")
      }
    } catch (error) {
      console.error("Weather command error:", error)
      await m.reply("❌ An error occurred while getting weather information.")
    }
  },
}
