const express = require("express")
const cors = require("cors")
const admin = require("firebase-admin")

const app = express()
const PORT = 4000

// Middleware
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  }),
)
app.use(express.json())

// Initialize Firebase Admin (you'll need your service account key)
// admin.initializeApp({
//   credential: admin.credential.cert(require('./path-to-service-account-key.json'))
// });

// Middleware to verify Firebase token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  try {
    // For testing, just log the token
    console.log("🔑 Received token:", token.substring(0, 50) + "...")

    // In production, verify with Firebase Admin:
    // const decodedToken = await admin.auth().verifyIdToken(token);
    // req.user = decodedToken;

    // For testing, mock user
    req.user = { uid: "test-user-123", email: "test@example.com" }
    next()
  } catch (error) {
    console.error("❌ Token verification failed:", error)
    res.status(403).json({ error: "Invalid token" })
  }
}

// Report endpoint
app.post("/api/report", authenticateToken, (req, res) => {
  const { reportedUrl, reportDetails } = req.body
  const userId = req.user.uid

  console.log("🚨 Report received:")
  console.log("  - URL:", reportedUrl)
  console.log("  - Details:", reportDetails)
  console.log("  - User ID:", userId)
  console.log("  - Timestamp:", new Date().toISOString())

  // Simulate saving to database
  setTimeout(() => {
    res.json({
      success: true,
      message: "Report submitted successfully",
      reportId: "report_" + Date.now(),
    })
  }, 1000)
})

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "PhisherShield Backend is running" })
})

app.listen(PORT, () => {
  console.log(`🚀 Test backend running on http://localhost:${PORT}`)
  console.log(`📡 Ready to receive reports from frontend`)
})
