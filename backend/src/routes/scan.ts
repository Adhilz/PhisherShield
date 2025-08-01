// backend/src/routes/scan.ts
import { Router } from 'express';
import { scanUrlAndRespond } from '../controllers/scanController';// Ensure this matches your controller function

const router = Router();

// Define the POST route for /trustScore that the frontend is calling
// This will handle requests to /api/trustScore because app.ts uses app.use('/api', scanRoute);
router.post('/trustScore', scanUrlAndRespond);

// You might have other routes in this file (e.g., for a general /scan endpoint)
// Example: router.post('/', scanController.handleGeneralScan);

export default router;