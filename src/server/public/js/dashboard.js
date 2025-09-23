
class DashboardManager {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000

    this.initializeSocket()
    this.setupEventListeners()
    this.startPerformanceMonitoring()
  }

  initializeSocket() {
    this.socket = io({
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: true,
    })

    this.socket.on("connect", () => {
      console.log("[Dashboard] Connected to server")
      this.isConnected = true
      this.reconnectAttempts = 0
      this.updateConnectionIndicator(true)

      // Join admin room
      this.socket.emit("join-admin", {
        isAdmin: true,
        timestamp: new Date().toISOString(),
      })
    })

    this.socket.on("disconnect", (reason) => {
      console.log("[Dashboard] Disconnected:", reason)
      this.isConnected = false
      this.updateConnectionIndicator(false)

      if (reason === "io server disconnect") {
        // Server initiated disconnect, try to reconnect
        this.attemptReconnect()
      }
    })

    this.socket.on("connect_error", (error) => {
      console.error("[Dashboard] Connection error:", error)
      this.updateConnectionIndicator(false)
      this.attemptReconnect()
    })

    // Real-time event handlers
    this.socket.on("new-message", (data) => {
      this.handleNewMessage(data)
    })

    this.socket.on("connection-status", (data) => {
      this.handleConnectionStatus(data)
    })

    this.socket.on("qr-code", (data) => {
      this.handleQRCode(data)
    })

    this.socket.on("bot-stats", (data) => {
      this.handleStatsUpdate(data)
    })

    this.socket.on("system-alert", (data) => {
      this.handleSystemAlert(data)
    })

    this.socket.on("console-log", (data) => {
      this.handleConsoleLog(data)
    })
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[Dashboard] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.socket.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.error("[Dashboard] Max reconnection attempts reached")
      this.showToast("Connection lost. Please refresh the page.", "danger")
    }
  }

  updateConnectionIndicator(connected) {
    const indicator = document.getElementById("connectionIndicator")
    if (indicator) {
      indicator.className = `connection-indicator ${connected ? "connected" : "disconnected"}`
      indicator.innerHTML = connected
        ? '<i class="bi bi-wifi"></i> Connected'
        : '<i class="bi bi-wifi-off"></i> Disconnected'
    }
  }

  handleNewMessage(data) {
    // Update message counter
    this.incrementCounter("totalMessages")

    // Add to activity log
    this.addActivityLog(`New message from ${data.senderName || data.sender}`, "info")

    // Update real-time message list if on messages page
    if (window.location.pathname.includes("/messages")) {
      this.addMessageToList(data)
    }

    // Show notification
    this.showNotification("New Message", `From: ${data.senderName || data.sender}`)
  }

  handleConnectionStatus(data) {
    const statusElements = document.querySelectorAll(".bot-status")
    statusElements.forEach((element) => {
      element.className = `badge bg-${data.isConnected ? "success" : "danger"}`
      element.innerHTML = `<i class="bi bi-circle-fill pulse"></i> ${data.isConnected ? "Connected" : "Disconnected"}`
    })

    this.addActivityLog(
      `Bot ${data.isConnected ? "connected" : "disconnected"}`,
      data.isConnected ? "success" : "danger",
    )
  }

  handleQRCode(data) {
    // Update QR code in modals
    const qrContainers = document.querySelectorAll("#qrCodeContainer")
    qrContainers.forEach((container) => {
      container.innerHTML = `
                <div class="qr-code-display">
                    <img src="data:image/png;base64,${data.qr}" alt="QR Code" class="img-fluid" style="max-width: 300px;">
                    <p class="mt-3 text-muted">Scan this QR code with WhatsApp</p>
                    <small class="text-muted">QR code expires in 60 seconds</small>
                </div>
            `
    })
  }

  handleStatsUpdate(data) {
    // Update dashboard statistics
    Object.keys(data).forEach((key) => {
      const element = document.getElementById(key)
      if (element) {
        element.textContent = data[key]
      }
    })
  }

  handleSystemAlert(data) {
    this.showToast(data.message, data.type || "warning")
    this.addActivityLog(data.message, data.type || "warning")
  }

  handleConsoleLog(data) {
    this.addConsoleLog(data.message, data.level)
  }

  setupEventListeners() {
    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "r":
            e.preventDefault()
            this.refreshCurrentPage()
            break
          case "m":
            e.preventDefault()
            this.showSendMessageModal()
            break
        }
      }
    })

    // Page visibility change
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // Page is hidden, reduce update frequency
        this.pauseRealTimeUpdates()
      } else {
        // Page is visible, resume normal updates
        this.resumeRealTimeUpdates()
      }
    })
  }

  startPerformanceMonitoring() {
    // Monitor performance metrics every 30 seconds
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics()
    }, 30000)

    // Monitor memory usage
    this.memoryInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, 60000)
  }

  async updatePerformanceMetrics() {
    try {
      const response = await fetch("/api/status")
      const data = await response.json()

      if (data.success) {
        // Update uptime
        const uptimeElement = document.getElementById("uptime")
        if (uptimeElement) {
          const hours = Math.floor(data.data.uptime / 3600)
          const minutes = Math.floor((data.data.uptime % 3600) / 60)
          uptimeElement.textContent = `${hours}h ${minutes}m`
        }

        // Update memory usage
        const memoryElement = document.getElementById("memoryUsage")
        if (memoryElement) {
          const memoryMB = Math.round(data.data.memoryUsage.heapUsed / 1024 / 1024)
          memoryElement.textContent = `${memoryMB}MB`
        }

        // Emit performance data to charts
        this.socket.emit("performance-data", {
          memory: data.data.memoryUsage.heapUsed,
          uptime: data.data.uptime,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("[Dashboard] Failed to update performance metrics:", error)
    }
  }

  checkMemoryUsage() {
    // Check if memory usage is getting high
    fetch("/api/status")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const memoryUsage = data.data.memoryUsage.heapUsed / data.data.memoryUsage.heapTotal

          if (memoryUsage > 0.8) {
            this.showToast("High memory usage detected. Consider restarting the bot.", "warning")
          }
        }
      })
      .catch((error) => {
        console.error("[Dashboard] Memory check failed:", error)
      })
  }

  incrementCounter(counterId) {
    const element = document.getElementById(counterId)
    if (element) {
      const currentValue = Number.parseInt(element.textContent) || 0
      element.textContent = currentValue + 1
    }
  }

  addActivityLog(message, type = "info") {
    const activityLog = document.getElementById("activityLog")
    if (!activityLog) return

    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement("div")
    logEntry.className = `d-flex align-items-center mb-2 text-${type}`
    logEntry.innerHTML = `
            <i class="bi bi-circle-fill me-2" style="font-size: 0.5rem;"></i>
            <small class="me-2 text-muted">${timestamp}</small>
            <span>${message}</span>
        `

    activityLog.insertBefore(logEntry, activityLog.firstChild)

    // Keep only last 20 entries
    while (activityLog.children.length > 20) {
      activityLog.removeChild(activityLog.lastChild)
    }
  }

  addConsoleLog(message, level = "info") {
    const consoleOutput = document.getElementById("consoleOutput")
    if (!consoleOutput) return

    const timestamp = new Date().toLocaleTimeString()
    const logEntry = document.createElement("div")
    logEntry.className = `console-entry text-${this.getLogColor(level)}`
    logEntry.innerHTML = `<span class="text-muted">[${timestamp}]</span> ${message}`

    consoleOutput.appendChild(logEntry)
    consoleOutput.scrollTop = consoleOutput.scrollHeight

    // Keep only last 100 entries
    while (consoleOutput.children.length > 100) {
      consoleOutput.removeChild(consoleOutput.firstChild)
    }
  }

  getLogColor(level) {
    switch (level) {
      case "error":
        return "danger"
      case "warn":
        return "warning"
      case "success":
        return "success"
      case "info":
        return "info"
      default:
        return "light"
    }
  }

  showNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body: body,
        icon: "/favicon.ico",
        tag: "akanebot-notification",
      })
    }
  }

  requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          this.showToast("Notifications enabled", "success")
        }
      })
    }
  }

  pauseRealTimeUpdates() {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval)
    }
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval)
    }
  }

  resumeRealTimeUpdates() {
    this.startPerformanceMonitoring()
  }

  refreshCurrentPage() {
    location.reload()
  }

  showSendMessageModal() {
    const modal = document.getElementById("sendMessageModal")
    if (modal) {
      const bootstrapModal = new bootstrap.Modal(modal)
      bootstrapModal.show()
    }
  }

  showToast(message, type = "info") {
    const toastHtml = `
            <div class="toast align-items-center text-white bg-${type} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">${message}</div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `

    let toastContainer = document.getElementById("toastContainer")
    if (!toastContainer) {
      toastContainer = document.createElement("div")
      toastContainer.id = "toastContainer"
      toastContainer.className = "toast-container position-fixed top-0 end-0 p-3"
      toastContainer.style.zIndex = "9999"
      document.body.appendChild(toastContainer)
    }

    toastContainer.insertAdjacentHTML("beforeend", toastHtml)

    const toastElement = toastContainer.lastElementChild
    const toast = new bootstrap.Toast(toastElement)
    toast.show()

    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove()
    })
  }

  // Cleanup method
  destroy() {
    if (this.socket) {
      this.socket.disconnect()
    }
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval)
    }
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval)
    }
  }
}

// Initialize dashboard when DOM is loaded
let dashboardManager
document.addEventListener("DOMContentLoaded", () => {
  dashboardManager = new DashboardManager()

  // Request notification permission
  dashboardManager.requestNotificationPermission()

  // Add connection indicator to navbar
  addConnectionIndicator()
})

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (dashboardManager) {
    dashboardManager.destroy()
  }
})

function addConnectionIndicator() {
  const navbar = document.querySelector(".navbar-nav:last-child")
  if (navbar) {
    const connectionLi = document.createElement("li")
    connectionLi.className = "nav-item"
    connectionLi.innerHTML = `
            <span class="nav-link" id="connectionIndicator">
                <i class="bi bi-wifi"></i> Connecting...
            </span>
        `
    navbar.insertBefore(connectionLi, navbar.firstChild)
  }
}

// Global utility functions
window.dashboardUtils = {
  formatBytes: (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },

  formatUptime: (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  },

  formatNumber: (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num.toString()
  },
}
