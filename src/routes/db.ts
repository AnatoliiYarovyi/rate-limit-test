import express from 'express';

import { DbCtrl } from '../controllers/Db';
import { rateLimiterPerIp, limiterPerClientIp } from '../middlewares/rateLimiters';

const router = express.Router();
const dbCtrl = new DbCtrl();

router.post('/createApiKey', (req, res, next) => dbCtrl.createApiKey(req, res, next));
router.post('/changeApiKey', (req, res, next) => dbCtrl.changeApiKey(req, res, next));

export default router;
