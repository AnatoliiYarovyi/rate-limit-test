import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const dynamicRateLimiter = (options: { windowMs: number }) => {
	const apiLimiter = rateLimit({
		windowMs: options.windowMs,
		max: getMaxValue,
		standardHeaders: true,
		legacyHeaders: false,
	});

	function getMaxValue(req: Request) {
		return req.app.locals.apiKeysCache[0].limit;
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

export default dynamicRateLimiter;
