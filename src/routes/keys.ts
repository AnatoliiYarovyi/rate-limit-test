import express from 'express';
import apiKeyRateLimiter from '../middlewares/apiKeyRateLimiter';
import { KeysCtrl } from '../controllers/Keys';

const router = express.Router();
const keysCtrl = new KeysCtrl();

const limiterOptions = {
	windowMs: 1 * 60 * 1000, // 1 min
};

router.get('/', apiKeyRateLimiter(limiterOptions), (req, res, next) =>
	keysCtrl.getKeys(req, res, next)
);

export default router;
