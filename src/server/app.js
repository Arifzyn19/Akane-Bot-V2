import express from "express"
import { createServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import path from "path"
import session from "express-session"
import MongoStore from "connect-mongo"
import expressLayouts from "express-ejs-layouts"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import { fileURLToPath } from "url"
import { dirname } from "path"

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Import routes
import authRoutes from "./routes/auth.js"
import dashboardRoutes from "./routes/dashboard.js"
import apiRoutes from "./routes/api.js"
import botRoutes from "./routes/bot.js"

class ExpressServer {
  constructor(botInstance) {
    this.bot = botInstance
    this.app = express()
    this.server = createServer(this.app)
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
        methods: ["GET", "POST"],
      },
    })

    this.setupMiddleware()
    this.setupRoutes()
    this.setupSocketIO()
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdn.socket.io",
          "https://cdn.tailwindcss.com",
          "https://unpkg.com/",
        ],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
)

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
    })
    this.app.use("/api/", limiter)

    // CORS
    this.app.use(cors())

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }))
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }))

    // Session configuration
    const sessionConfig = {
      secret: process.env.SESSION_SECRET || "akane-bot-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }

    // Use MongoDB store if available
    if (process.env.MONGO_URI) {
      sessionConfig.store = MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        touchAfter: 24 * 3600, // lazy session update
      })
    }

    this.app.use(session(sessionConfig))

    // EJS setup
    this.app.set("view engine", "ejs")
    this.app.set("views", path.join(__dirname, "./views"))
    this.app.use(expressLayouts)
    this.app.set("layout", "layouts/main")

    // Static files
    this.app.use(express.static(path.join(__dirname, "./public")))

    // Make bot instance available to all routes
    this.app.use((req, res, next) => {
      req.bot = this.bot
      req.io = this.io
      next()
    })

    this.app.use((req, res, next) => {
      res.locals.user = req.session?.user || null
      res.locals.isAuthenticated = !!req.session?.isAuthenticated
      next()
    })
  }

  setupRoutes() {
    // Authentication routes
    this.app.use("/auth", authRoutes)

    // Dashboard routes (protected)
    this.app.use("/dashboard", this.requireAuth, dashboardRoutes)

    // API routes (protected)
    this.app.use("/api", this.requireAuth, apiRoutes)

    // Bot control routes (protected)
    this.app.use("/bot", this.requireAuth, botRoutes)

    // Root redirect
    this.app.get("/", (req, res) => {
      if (req.session.isAuthenticated) {
        res.redirect("/dashboard")
      } else {
        res.redirect("/auth/login")
      }
    })

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).render("error", {
        title: "Page Not Found",
        error: {
          status: 404,
          message: "The page you are looking for does not exist.",
        },
      })
    })

    // Error handler
    this.app.use((err, req, res, next) => {
      console.error("Server Error:", err)
      res.status(err.status || 500).render("error", {
        title: "Server Error",
        error: {
          status: err.status || 500,
          message: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
        },
      })
    })
  }

  setupSocketIO() {
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Join admin room if authenticated
      socket.on("join-admin", (data) => {
        if (data.isAdmin) {
          socket.join("admin-room")
          console.log("Admin joined:", socket.id)
        }
      })

      // Handle bot control commands
      socket.on("bot-command", async (data) => {
        try {
          const result = await this.handleBotCommand(data)
          socket.emit("bot-response", result)
        } catch (error) {
          socket.emit("bot-error", { error: error.message })
        }
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    /* 
    if (this.bot) {
      this.bot.on("message", (data) => {
        this.io.to("admin-room").emit("new-message", data)
      })

      this.bot.on("connection-update", (data) => {
        this.io.to("admin-room").emit("connection-status", data)
      })

      this.bot.on("qr-code", (qr) => {
        this.io.to("admin-room").emit("qr-code", { qr })
      })
    }
    */
  }

  async handleBotCommand(data) {
    const { command, params } = data

    switch (command) {
      case "restart":
        await this.bot.restart()
        return { success: true, message: "Bot restarted successfully" }

      case "send-message":
        await this.bot.sendMessage(params.to, params.message)
        return { success: true, message: "Message sent successfully" }

      case "get-status":
        return {
          success: true,
          data: {
            isConnected: this.bot.isConnected(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
          },
        }

      default:
        throw new Error("Unknown command")
    }
  }

  requireAuth(req, res, next) {
    if (req.session.isAuthenticated) {
      next()
    } else {
      if (req.xhr || req.headers.accept?.indexOf("json") > -1) {
        res.status(401).json({ error: "Authentication required" })
      } else {
        res.redirect("/auth/login")
      }
    }
  }

  start(port = process.env.PORT || 3000) {
    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log(`🌐 Dashboard server running on port ${port}`)
        console.log(`📊 Dashboard URL: http://localhost:${port}`)
        resolve()
      })
    })
  }

  stop() {
    this.server.close()
  }
}

let serverInstance = null

export async function startServer(botInstance) {
  if (!serverInstance) {
    serverInstance = new ExpressServer(botInstance)
    await serverInstance.start()
  }
  return {
    server: serverInstance.server,
    io: serverInstance.io,
    app: serverInstance.app,
  }
}

export default ExpressServer
