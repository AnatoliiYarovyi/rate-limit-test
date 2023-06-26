import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const rateLimiter = () => {
	const apiLimiter = rateLimit({
		windowMs: 1 * 1000 /* 5s */,
		max: 9,
		standardHeaders: true,
		legacyHeaders: false,
		message: 'Too many requests, please try again later. [ rateLimiter ]',
	});

	return (req: Request, res: Response, next: NextFunction) => {
		try {
			apiLimiter(req, res, next);
		} catch (error) {
			res.status(429).json({
				message: 'Too many requests, please try again later. [ catch -> rateLimiter ]',
			}); 
		}
	};
};

export default rateLimiter;
