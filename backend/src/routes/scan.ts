import { Router } from 'express';
import { scanUrlController } from '../controllers/scanController';

const router = Router();

router.post('/scan', scanUrlController);

export default router;