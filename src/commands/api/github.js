export default {
  name: "github",
  command: ["github", "gh", "repo"],
  description: "Get GitHub repository information",
  category: "api",
  cooldown: 10,

  async execute(m, { args }) {
    try {
      if (!args.length) {
        return await m.reply("❌ Please provide a GitHub repository!\n\nExample: !github facebook/react")
      }

      const repo = args[0]

      // Validate repo format (owner/repo)
      if (!repo.includes("/") || repo.split("/").length !== 2) {
        return await m.reply("❌ Invalid repository format! Use: owner/repository\n\nExample: !github facebook/react")
      }

      await m.reply("🔍 Getting repository information...")

      try {
        const response = await fetch(`https://api.github.com/repos/${repo}`)

        if (!response.ok) {
          if (response.status === 404) {
            return await m.reply(`❌ Repository "${repo}" not found!`)
          }
          throw new Error(`GitHub API Error: ${response.status}`)
        }

        const data = await response.json()

        let repoInfo = `📁 *GitHub Repository*\n\n`
        repoInfo += `🏷️ *Name:* ${data.name}\n`
        repoInfo += `👤 *Owner:* ${data.owner.login}\n`
        repoInfo += `📝 *Description:* ${data.description || "No description"}\n`
        repoInfo += `🌐 *Language:* ${data.language || "Not specified"}\n`
        repoInfo += `⭐ *Stars:* ${data.stargazers_count.toLocaleString()}\n`
        repoInfo += `🍴 *Forks:* ${data.forks_count.toLocaleString()}\n`
        repoInfo += `👁️ *Watchers:* ${data.watchers_count.toLocaleString()}\n`
        repoInfo += `🐛 *Open Issues:* ${data.open_issues_count}\n`
        repoInfo += `📊 *Size:* ${(data.size / 1024).toFixed(2)} MB\n`

        if (data.license) {
          repoInfo += `📄 *License:* ${data.license.name}\n`
        }

        repoInfo += `📅 *Created:* ${new Date(data.created_at).toLocaleDateString()}\n`
        repoInfo += `🔄 *Updated:* ${new Date(data.updated_at).toLocaleDateString()}\n`
        repoInfo += `🔗 *URL:* ${data.html_url}`

        await m.reply(repoInfo)
      } catch (error) {
        console.error("GitHub API error:", error)
        await m.reply("❌ Failed to get repository information. Please try again later.")
      }
    } catch (error) {
      console.error("GitHub command error:", error)
      await m.reply("❌ An error occurred while getting repository information.")
    }
  },
}
