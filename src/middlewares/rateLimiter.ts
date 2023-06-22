import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const rateLimiter = () => {
	const apiLimiter = rateLimit({
		windowMs: 10 * 1000 /* 10s */,
		max: 2,
		standardHeaders: true,
		legacyHeaders: false,
	});

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

export default rateLimiter;
