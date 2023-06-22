import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

import { ApiKeysCache } from '../interfaces/App';

const { REQUEST_LIMIT_WITHOUT_API_KEY } = process.env;

const apiKeyRateLimiter = (options: { windowMs: number }) => {
	const apiLimiter = rateLimit({
		windowMs: options.windowMs,
		max: getMaxValue,
		standardHeaders: true,
		legacyHeaders: false,
	});

	function getMaxValue(req: Request) {
		const { apiKey } = req.query;
		const limit = apiKey
			? req.app.locals.apiKeysCache.reduce((acc: number, el: ApiKeysCache) => {
					if (el.apiKey === apiKey) {
						acc = el.limit;
					}

					return acc;
			  }, null)
			: +REQUEST_LIMIT_WITHOUT_API_KEY;

		return limit;
	}

	return (req: Request, res: Response, next: NextFunction) => {
		try {
			apiLimiter(req, res, next);
		} catch (error) {
			res.status(429).json({ message: 'Too many requests, please try again later.' });
		}
	};
};

export default apiKeyRateLimiter;
