import { Router } from 'express';
import { reportPhishing } from '../controllers/reportController';

const router = Router();

router.post('/report', reportPhishing);

export default router;