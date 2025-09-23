export default {
  name: "crypto",
  command: ["crypto", "coin", "bitcoin"],
  description: "Get cryptocurrency prices",
  category: "api",
  cooldown: 10,

  async execute(m, { args }) {
    try {
      const coin = args[0] || "bitcoin"

      await m.reply("💰 Getting cryptocurrency data...")

      try {
        // Using CoinGecko API (free, no key required)
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd,idr&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`,
        )

        if (!response.ok) {
          throw new Error(`Crypto API Error: ${response.status}`)
        }

        const data = await response.json()

        if (!data[coin]) {
          return await m.reply(
            `❌ Cryptocurrency "${coin}" not found!\n\nTry: bitcoin, ethereum, binancecoin, cardano, solana, etc.`,
          )
        }

        const coinData = data[coin]

        let crypto = `💰 *Cryptocurrency Price*\n\n`
        crypto += `🪙 *Coin:* ${coin.charAt(0).toUpperCase() + coin.slice(1)}\n`
        crypto += `💵 *USD:* $${coinData.usd.toLocaleString()}\n`
        crypto += `💴 *IDR:* Rp ${coinData.idr.toLocaleString()}\n`

        if (coinData.usd_24h_change) {
          const change = coinData.usd_24h_change
          const changeEmoji = change >= 0 ? "📈" : "📉"
          const changeColor = change >= 0 ? "+" : ""
          crypto += `${changeEmoji} *24h Change:* ${changeColor}${change.toFixed(2)}%\n`
        }

        if (coinData.usd_market_cap) {
          crypto += `📊 *Market Cap:* $${(coinData.usd_market_cap / 1e9).toFixed(2)}B\n`
        }

        if (coinData.usd_24h_vol) {
          crypto += `📈 *24h Volume:* $${(coinData.usd_24h_vol / 1e6).toFixed(2)}M\n`
        }

        crypto += `\n⏰ *Updated:* ${new Date().toLocaleString()}`

        await m.reply(crypto)
      } catch (error) {
        console.error("Crypto API error:", error)
        await m.reply("❌ Failed to get cryptocurrency data. Please try again later.")
      }
    } catch (error) {
      console.error("Crypto command error:", error)
      await m.reply("❌ An error occurred while getting cryptocurrency data.")
    }
  },
}
