import BotMonitor from "../../lib/monitoring"

let monitorInstance = null

function initializeMonitoring(bot, io) {
  if (!monitorInstance) {
    monitorInstance = new BotMonitor(bot, io)
    console.log("[Monitoring] Real-time monitoring initialized")
  }
  return monitorInstance
}

function getMonitorInstance() {
  return monitorInstance
}

// Middleware to add monitoring data to requests
function addMonitoringData(req, res, next) {
  if (monitorInstance) {
    req.monitor = monitorInstance
    req.stats = monitorInstance.getStatistics()
  }
  next()
}

// Middleware to log API requests
function logApiRequest(req, res, next) {
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    }

    // Log to console
    console.log(`[API] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`)

    // Emit to monitoring system
    if (monitorInstance) {
      monitorInstance.emit("api-request", logData)
    }
  })

  next()
}

// Error handling middleware with monitoring
function errorHandler(err, req, res, next) {
  console.error("[Server Error]", err)

  // Log error to monitoring system
  if (monitorInstance) {
    monitorInstance.emit("server-error", {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    })
  }

  // Send error response
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
  })
}

export {
  initializeMonitoring,
  getMonitorInstance,
  addMonitoringData,
  logApiRequest,
  errorHandler,
}
