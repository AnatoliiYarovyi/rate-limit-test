import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

import { ApiKeysCache } from '../interfaces/App';

const apiKeyRateLimiter = (options: { windowMs: number }) => {
	const apiLimiter = rateLimit({
		windowMs: options.windowMs,
		max: getMaxValue,
		standardHeaders: true,
		legacyHeaders: false,
	});

	function getMaxValue(req: Request) {
		const { apiKey } = req.query;
		const limit = req.app.locals.apiKeysCache.reduce(
			(acc: number, el: ApiKeysCache) => {
				if (el.apiKey === apiKey) {
					acc = el.limit;
				}

				return acc;
			},
			null
		);
		if (!limit) {
			throw new Error('For access, pass the apiKey parameter');
		}

		return limit;
	}

	return (req: Request, res: Response, next: NextFunction) => {
		try {
			apiLimiter(req, res, next);
		} catch (error) {
			res
				.status(429)
				.json({ message: 'Too many requests, please try again later.' });
		}
	};
};

export default apiKeyRateLimiter;
