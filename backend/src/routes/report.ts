// backend/src/routes/report.ts
import { Router } from 'express';
import { createReport, getUserReports, getAllReports, verifyIdToken } from '../controllers/reportController';

const router = Router();

// Protect routes that require authentication
router.use(verifyIdToken); // All routes below this will require a valid ID token

// POST /api/report - Submit a new report (authenticated)
router.post('/', createReport);
// GET /api/report/my - Get reports submitted by the current user (authenticated)
router.get('/my', getUserReports);
// GET /api/report/all - Get all reports (for admin - requires more robust auth)
router.get('/all', getAllReports);

export default router;