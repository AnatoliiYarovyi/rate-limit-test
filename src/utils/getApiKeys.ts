import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import * as dotenv from 'dotenv';
dotenv.config();

const { REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

const dynamoDBClient = new DynamoDBClient({
	region: REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

export const getApiKeys = async () => {
	try {
		const params = {
			TableName: 'api-keys-test',
		};
		const command = new ScanCommand(params);
		const response = await dynamoDBClient.send(command);

		const apiKeys = response.Items.map((item) => {
			return {
				id: item.id.S,
				apiKey: item.apiKey.S,
				limit: +item.limit.N,
			};
		});
		return apiKeys;
	} catch (error) {
		console.error('getApiKeys:', error);
		throw error;
	}
};
