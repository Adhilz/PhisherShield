import { Router } from 'express';
import { calculateTrustScore } from '../controllers/trustScoreController';

const router = Router();

router.post('/trust-score', calculateTrustScore);

export default router;