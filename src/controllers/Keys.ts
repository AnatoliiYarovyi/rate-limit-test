import { NextFunction, Request, Response } from 'express';

import { TypedDataResponse } from '../interfaces/Controllers';
import { ApiKeysCache } from '../interfaces/App';

export class KeysCtrl {
	async getKeys(req: Request, res: Response, next: NextFunction) {
		try {
			const qwe = req.app.locals.apiKeysCache as ApiKeysCache[];

			const typedDataResponse: TypedDataResponse<ApiKeysCache[]> = {
				results: qwe,
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
