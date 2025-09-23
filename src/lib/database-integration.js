import database from "./database.js"

export class DatabaseIntegration {
  constructor() {
    this.db = database
  }

  async updateBotStats(stats) {
    if (!this.db.data.stats.bot) {
      this.db.data.stats.bot = {}
    }

    this.db.data.stats.bot = {
      ...this.db.data.stats.bot,
      ...stats,
      lastUpdated: Date.now(),
    }

    await this.db.write()
  }

  async logMessage(messageData) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (!this.db.data.msgs.recent) {
      this.db.data.msgs.recent = []
    }

    this.db.data.msgs.recent.unshift({
      id: messageId,
      ...messageData,
      timestamp: Date.now(),
    })

    // Keep only last 100 messages
    if (this.db.data.msgs.recent.length > 100) {
      this.db.data.msgs.recent = this.db.data.msgs.recent.slice(0, 100)
    }

    await this.db.write()
    return messageId
  }

  async getDashboardStats() {
    const stats = this.db.data.stats || {}
    const messages = this.db.data.msgs.recent || []
    const users = Object.keys(this.db.data.users || {}).length
    const groups = Object.keys(this.db.data.groups || {}).length

    return {
      bot: stats.bot || {},
      totalUsers: users,
      totalGroups: groups,
      totalMessages: messages.length,
      recentMessages: messages.slice(0, 10),
      uptime: stats.bot?.uptime || 0,
      lastActivity: stats.bot?.lastUpdated || Date.now(),
    }
  }

  async updateUser(jid, userData) {
    if (!this.db.data.users[jid]) {
      this.db.data.users[jid] = {}
    }

    this.db.data.users[jid] = {
      ...this.db.data.users[jid],
      ...userData,
      lastSeen: Date.now(),
    }

    await this.db.write()
  }

  async updateGroup(jid, groupData) {
    if (!this.db.data.groups[jid]) {
      this.db.data.groups[jid] = {}
    }

    this.db.data.groups[jid] = {
      ...this.db.data.groups[jid],
      ...groupData,
      lastActivity: Date.now(),
    }

    await this.db.write()
  }

  async getAllData() {
    return {
      users: this.db.data.users || {},
      groups: this.db.data.groups || {},
      messages: this.db.data.msgs || {},
      stats: this.db.data.stats || {},
      settings: this.db.data.settings || {},
    }
  }
}

export const dbIntegration = new DatabaseIntegration()
 