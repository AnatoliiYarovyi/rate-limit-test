import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import 'dotenv/config';

const { REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, TABLE_NAME } = process.env;

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
			TableName: TABLE_NAME,
		};
		const command = new ScanCommand(params);
		const response = await dynamoDBClient.send(command);
		
		const apiKeys = response.Items.map((item) => {			
			return {
				id: item.id.S,
				apiKey: item.apiKey.S,
				limit: +item.limit.N,
				quantity: +item?.quantity?.N || 0,
			};
		});
		return apiKeys;
	} catch (error) {
		console.error('getApiKeys:', error);
		throw error;
	}
};
