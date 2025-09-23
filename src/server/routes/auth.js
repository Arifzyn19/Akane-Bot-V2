import express from "express"
import bcrypt from "bcryptjs"
const router = express.Router()

// Admin credentials (in production, use database)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123", // Should be hashed in production
}

// Login page
router.get("/login", (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect("/dashboard")
  }

  res.render("auth/login", {
    title: "Admin Login",
    layout: "layouts/auth",
    error: req.query.error,
  })
})

// Login handler
router.post("/login", async (req, res) => {
  const { username, password } = req.body

  try {
    // Validate credentials
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      req.session.isAuthenticated = true
      req.session.user = {
        username: username,
        role: "admin",
      }

      res.redirect("/dashboard")
    } else {
      res.redirect("/auth/login?error=Invalid credentials")
    }
  } catch (error) {
    console.error("Login error:", error)
    res.redirect("/auth/login?error=Login failed")
  }
})

// Logout handler
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err)
    }
    res.redirect("/auth/login")
  })
})

// Check auth status (API)
router.get("/status", (req, res) => {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    user: req.session.user || null,
  })
})

export default router
