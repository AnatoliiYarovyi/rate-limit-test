import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

import { ApiKeysCache } from '../interfaces/App';

const { REQUEST_LIMIT_WITHOUT_API_KEY } = process.env;

const apiKeyRateLimiter = (options: { windowMs: number }) => {
	const apiLimiter = rateLimit({
		windowMs: options.windowMs,
		max: getMaxValue,
		keyGenerator: (req: Request) =>
			(req.query.apiKey as string) ||
			(req.headers['x-forwarded-for'] as string) ||
			req.socket.remoteAddress,
		standardHeaders: true, 
		legacyHeaders: false,
		message: 'Too many requests, please try again later. [ apiKeyRateLimiter ]',
	});

	function getMaxValue(req: Request) {
		console.log('request.ip', req.ip);
		console.log(`req.headers['x-forwarded-for']`, req.headers['x-forwarded-for']);
		console.log('req.socket.remoteAddress', req.socket.remoteAddress);
		
		
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
			res.status(429).json({
				message:
					'Too many requests, please try again later. [ catch -> apiKeyRateLimiter ]',
			});
		}
	};
};

export default apiKeyRateLimiter;
