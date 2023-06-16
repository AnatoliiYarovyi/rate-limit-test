import express from 'express';

import dynamicRateLimiter from '../middlewares/dynamicRateLimiter';
import { KeysCtrl } from '../controllers/Keys';

const router = express.Router();
const keysCtrl = new KeysCtrl();

router.get(
	'/',
	dynamicRateLimiter({
		windowMs: 1 * 60 * 1000, // 1 min
		max: (req) => req.app.locals.apiKeysCache[0].limit,
		standardHeaders: true,
		legacyHeaders: false,
	}),
	(req, res, next) => keysCtrl.getKeys(req, res, next)
);

export default router;
