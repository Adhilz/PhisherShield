// backend/src/app.ts - COMPLETE FILE
import express from "express"
import scanRoute from "./routes/scan"
import reportRoute from "./routes/report"
import healthRoute from "./routes/health"
import cors from "cors"
import "./firebaseAdmin"
import { connectToHana } from "./hanaClient"
require("dotenv").config()

// Log environment variables
console.log("Environment Variables Loaded:")
console.log("GOOGLE_SAFE_Browse_API_KEY:", process.env.GOOGLE_SAFE_Browse_API_KEY ? "Loaded" : "NOT LOADED")
console.log("WHOIS_XML_API_KEY:", process.env.WHOIS_XML_API_KEY ? "Loaded" : "NOT LOADED")
console.log("ABUSE_IPDB_API_KEY:", process.env.ABUSE_IPDB_API_KEY ? "Loaded" : "NOT LOADED")
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Loaded" : "NOT LOADED")

// Connect to SAP HANA on startup
connectToHana().catch((err) => {
  console.error("Failed to connect to SAP HANA:", err)
})

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// --- CRITICAL FIX: Enable CORS for BOTH ports ---
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // <-- ADD 3001
    credentials: true,
  }),
)
// --- END CRITICAL FIX ---

// Routes
app.use("/api", healthRoute)
app.use("/api", scanRoute)
app.use("/api/report", reportRoute)

app.listen(4000, () => {
  console.log("🚀 PhisherShield Backend running on http://localhost:4000")
  console.log("📡 Ready to receive reports from http://localhost:3000 and http://localhost:3001") // <-- UPDATE MESSAGE
  console.log("🏥 Health check: http://localhost:4000/api/health")
  console.log("📝 Report endpoint: POST http://localhost:4000/api/report")
})
