import express from 'express';
// import apiKeyRateLimiter from '../middlewares/apiKeyRateLimiter';
import { KeysCtrl } from '../controllers/Keys';
import { limiterPerClient } from '../middlewares/rateLimiters';

const router = express.Router();
const keysCtrl = new KeysCtrl();

// for apiKeyRateLimiter(limiterOptions),
// const limiterOptions = {
// 	windowMs: 1 * 60 * 1000, // 1 min
// };

router.get('/', limiterPerClient(), (req, res, next) =>
	keysCtrl.getKeys(req, res, next)
);

export default router;
