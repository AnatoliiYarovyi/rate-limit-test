import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

import { ApiKeysCache } from '../interfaces/App';

const { REQUEST_LIMIT_WITHOUT_API_KEY } = process.env;

export const limiterPerSystem = () => {
	const apiLimiter = rateLimit({
		windowMs: 15 * 1000, // 15 seconds
		max: (req, res) => {
			const max = req.originalUrl.startsWith('/apiKey') ? 11 : 10;			
			return max
		}, // Limit each IP to 5 requests per `window` (here, per 15 seconds)
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
		keyGenerator: (req, res) => 'perAllClients',
		message: 'system limiter',
		requestWasSuccessful: (request, response) => response.statusCode != 429,
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

export const limiterPerClientApiKey = () => {
	const apiLimiter = rateLimit({
		windowMs: 60 * 1000, // 60 seconds
		max: getMaxValue,
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
		keyGenerator: getKey,
		message: 'system limiter',
		requestWasSuccessful: (_, response) => response.statusCode != 429,
	});

	function getMaxValue(req: Request) {
		const { apiKey } = req.query;
		const limit: number = apiKey
			? req.app.locals.apiKeysCache.reduce((acc: number, el: ApiKeysCache) => {
					if (el.apiKey === apiKey) {
						acc = el.limit;
					}

					return acc;
			  }, null)
			: +REQUEST_LIMIT_WITHOUT_API_KEY;

		return limit;
	}

	function getKey(req: Request) {
		if (req.headers['x-api-key']) {
			return req.headers['x-api-key'] as string;
		} else {
			if (req.headers['x-forwarded-for']) {
				if (
					Array.isArray(req.headers['x-forwarded-for']) &&
					req.headers['x-forwarded-for'].length
				) {
					return req.headers['x-forwarded-for'][0];
				} else {
					return req.headers['x-forwarded-for'] as string;
				}
			} else {
				return req.ip;
			}
		}
	}

	return (req: Request, res: Response, next: NextFunction) => {
		try {
			apiLimiter(req, res, next);
		} catch (error) {
			res.status(429).json({
				message:
					'Too many requests, please try again later. [ catch -> limiterPerClientApiKey ]',
			});
		}
	};
};

export const limiterPerClient = () => {
	const apiLimiter = rateLimit({
		windowMs: 60 * 1000, // 60 seconds
		max: 2,
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
		keyGenerator: getKey,
		message: 'system limiter',
		requestWasSuccessful: (_, response) => response.statusCode != 429,
	});

	function getKey(req: Request) {
			if (req.headers['x-forwarded-for']) {
				if (
					Array.isArray(req.headers['x-forwarded-for']) &&
					req.headers['x-forwarded-for'].length
				) {
					return req.headers['x-forwarded-for'][0];
				} else {
					return req.headers['x-forwarded-for'] as string;
				}
			} else {
				return req.ip;
			}
	}

	return (req: Request, res: Response, next: NextFunction) => {
		try {
			apiLimiter(req, res, next);
		} catch (error) {
			res.status(429).json({
				message: 'Too many requests, please try again later. [ catch -> limiterPerClient ]',
			});
		}
	};
};