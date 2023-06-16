import { NextFunction, Request, Response } from 'express';

import { TypedDataResponse } from '../interfaces/Controllers';

export class KeysCtrl {
	async getKeys(req: Request, res: Response, next: NextFunction) {
		try {
			const qwe = req.app.locals.apiKeysCache as string;

			const typedDataResponse: TypedDataResponse<string> = {
				message: qwe,
			};

			res.status(200).json({
				status: 'success',
				data: typedDataResponse,
			});
		} catch (error) {
			next(error);
		}
	}
}
