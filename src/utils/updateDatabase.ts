import { Express } from 'express';
import {
	DynamoDBClient,
	UpdateItemCommand,
	UpdateItemCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { ApiKeysCache } from '../interfaces/App';

const { REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, TABLE_NAME } = process.env;

const dynamoDBClient = new DynamoDBClient({
	region: REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

export async function updateDatabase(app: Express) {
	const apiKeysCache = app.locals.apiKeysCache as ApiKeysCache[];

	await Promise.all(
		apiKeysCache.map(async (apiKeyData) => {
			const { apiKey, date, quantity } = apiKeyData;
			const currentTimestamp = new Date().getTime();

			if (currentTimestamp - date < 1 * 60 * 1000) {
				const updateParams = {
					TableName: TABLE_NAME,
					Key: marshall({ apiKey }),
					UpdateExpression: 'SET quantity = :quantity',
					ExpressionAttributeValues: marshall({
						':quantity': quantity,
					}),
				};

				try {
					const command = new UpdateItemCommand(updateParams);
					const result = await dynamoDBClient.send(command);
					console.log(result);
					console.log(`Данные обновлены в базе данных по apiKey: ${apiKey}`);
					console.log(app.locals.apiKeysCache);
				} catch (error) {
					console.error(`Ошибка при обновлении данных по apiKey: ${apiKey}`, error);
				}
			}
		})
	);
}

export async function resetQuantityAtMidnight(app: Express) {
	const apiKeysCache = app.locals.apiKeysCache as ApiKeysCache[];

	const updatePromises: Promise<UpdateItemCommandOutput>[] = [];

	apiKeysCache.forEach((apiKeyData) => {
		if (apiKeyData.quantity !== 0) {
			const { apiKey } = apiKeyData;

			const updateParams = {
				TableName: TABLE_NAME,
				Key: marshall({ apiKey }),
				UpdateExpression: 'SET quantity = :quantity',
				ExpressionAttributeValues: marshall({
					':quantity': 0,
				}),
			};

			const updatePromise = dynamoDBClient.send(new UpdateItemCommand(updateParams));
			updatePromises.push(updatePromise);
		}
	});

	try {
		const updateResults = await Promise.allSettled(updatePromises);
		updateResults.forEach((result) => {
			if (result.status === 'fulfilled') {
				console.log('Обновление успешно выполнено:', result.value);
			} else {
				console.error('Ошибка при обновлении:', result.reason);
			}
		});
	} catch (error) {
		console.error('Ошибка при обнулении quantity:', error);
	}
}
