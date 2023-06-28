import { NextFunction, Request, Response } from 'express';
import { DynamoDBClient, UpdateItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';

import { TypedDataResponse } from '../interfaces/Controllers';

const { REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, TABLE_NAME } = process.env;

const dynamoDBClient = new DynamoDBClient({
	region: REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

export class DbCtrl {
	async createApiKey(req: Request, res: Response, next: NextFunction) {
		try {
			const { apiKey, limit } = req.body;
			const putParams = {
				TableName: TABLE_NAME,
				Item: marshall({
					id: uuidv4(),
					apiKey: apiKey,
					limit: limit,
				}),
			};

			const command = new PutItemCommand(putParams);
			const result = await dynamoDBClient.send(command);

			const typedDataResponse: TypedDataResponse<any> = {
				results: result,
			};

			res.status(200).json({
				status: 'success',
				data: typedDataResponse,
			});
		} catch (error) {
			console.error('Error updating item:', error);
			next(error);
		}
	}

	async changeApiKey(req: Request, res: Response, next: NextFunction) {
		try {
			const { apiKey, limit } = req.body;
			const updateParams = {
				TableName: TABLE_NAME,
				Key: marshall({ apiKey }),
				UpdateExpression: 'SET #limit = :newLimit',
				ExpressionAttributeNames: {
					'#limit': 'limit',
				},
				ExpressionAttributeValues: marshall({
					':newLimit': limit,
				}),
			};

			const command = new UpdateItemCommand(updateParams);
			const result = await dynamoDBClient.send(command);

			const typedDataResponse: TypedDataResponse<any> = {
				results: result,
			};

			res.status(200).json({
				status: 'success',
				data: typedDataResponse,
			});
		} catch (error) {
			console.error('Error updating item:', error);
			next(error);
		}
	}
}
