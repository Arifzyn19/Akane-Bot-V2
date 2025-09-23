export default {
  name: "calculator",
  command: ["calc", "calculate", "math"],
  description: "Perform mathematical calculations",
  category: "utility",
  cooldown: 3,

  async execute(m, { args }) {
    try {
      if (!args.length) {
        return await m.reply(
          "❌ Please provide a mathematical expression!\n\nExample: !calc 2 + 2 * 3\n\nSupported: +, -, *, /, %, ^, sqrt(), sin(), cos(), tan()",
        )
      }

      let expression = args.join(" ")

      // Security: Remove dangerous functions and characters
      const dangerousPatterns = [
        /eval/gi,
        /function/gi,
        /return/gi,
        /while/gi,
        /for/gi,
        /if/gi,
        /else/gi,
        /var/gi,
        /let/gi,
        /const/gi,
        /import/gi,
        /require/gi,
        /process/gi,
        /global/gi,
        /window/gi,
        /document/gi,
      ]

      for (const pattern of dangerousPatterns) {
        if (pattern.test(expression)) {
          return await m.reply("❌ Invalid expression! Only mathematical operations are allowed.")
        }
      }

      // Replace common mathematical functions
      expression = expression
        .replace(/\^/g, "**")
        .replace(/sqrt\(/g, "Math.sqrt(")
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log(")
        .replace(/pi/gi, "Math.PI")
        .replace(/e/gi, "Math.E")

      try {
        // Evaluate the expression safely
        const result = Function(`"use strict"; return (${expression})`)()

        if (typeof result !== "number" || !isFinite(result)) {
          throw new Error("Invalid result")
        }

        let response = `🧮 *Calculator Result*\n\n`
        response += `📝 *Expression:* ${args.join(" ")}\n`
        response += `✅ *Result:* ${result}`

        // Add additional info for interesting results
        if (result % 1 !== 0) {
          response += `\n🔢 *Decimal:* ${result.toFixed(6)}`
        }

        if (result > 1000000) {
          response += `\n📊 *Scientific:* ${result.toExponential(3)}`
        }

        await m.reply(response)
      } catch (error) {
        console.error("Calculation error:", error)
        await m.reply("❌ Invalid mathematical expression! Please check your syntax.")
      }
    } catch (error) {
      console.error("Calculator command error:", error)
      await m.reply("❌ An error occurred while performing the calculation.")
    }
  },
}
