import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const dynamicRateLimiter = (options) => {
	const apiLimiter = rateLimit({
		windowMs: options.windowMs,
		max: options.max,
		standardHeaders: options.standardHeaders,
		legacyHeaders: options.legacyHeaders,
	});

	return (req: Request, res: Response, next: NextFunction) => {
		try {
			apiLimiter(req, res, next);
		} catch (error) {
			res.status(429).json({ message: 'Превышен лимит запросов' });
		}
	};
};

export default dynamicRateLimiter;
