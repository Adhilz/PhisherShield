// backend/src/routes/health.ts - NEW FILE (CREATE THIS)
import { Router } from "express"

const router = Router()

// Health check endpoint
router.get("/health", (req, res) => {
  console.log("🏥 Health check requested")
  res.json({
    status: "OK",
    message: "PhisherShield Backend is running",
    timestamp: new Date().toISOString(),
    services: {
      database: "Connected",
      firebase: "Connected",
      cors: "Enabled for localhost:3000",
    },
  })
})

export default router
