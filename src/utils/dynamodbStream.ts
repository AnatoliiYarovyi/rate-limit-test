import { Express } from 'express';
import {
	DynamoDBStreamsClient,
	GetRecordsCommand,
	DescribeStreamCommand,
	GetShardIteratorCommand,
	_Record,
} from '@aws-sdk/client-dynamodb-streams';
import * as dotenv from 'dotenv';
dotenv.config();

import { ApiKeysCache } from '../interfaces/App';

const { REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, STREAM_ARN_TABLE } =
	process.env;

const dynamodbStreamsClient = new DynamoDBStreamsClient({
	region: REGION,
	credentials: {
		accessKeyId: AWS_ACCESS_KEY_ID,
		secretAccessKey: AWS_SECRET_ACCESS_KEY,
	},
});

const processDynamoDBStream = (record: _Record, app: Express) => {
	console.log('apiKeysCacheOld:', app.locals.apiKeysCache);

	const id = record.dynamodb.Keys.id.S;
	const { apiKey, limit } = record.dynamodb.NewImage;

	const index = app.locals.apiKeysCache.findIndex(
		(apiKeyData: ApiKeysCache) => apiKeyData.id === id
	);

	if (index >= 0) {
		app.locals.apiKeysCache[index].apiKey = apiKey.S.toString();
		app.locals.apiKeysCache[index].limit = +limit.N;
	} else {
		app.locals.apiKeysCache.push({
			id,
			apiKey: apiKey.S.toString(),
			limit: +limit.N,
		});
	}

	console.log('apiKeysCacheNew:', app.locals.apiKeysCache);
};

const readStream = async (shardIterator: string, app: Express) => {
	const getRecordsCommand = new GetRecordsCommand({
		ShardIterator: shardIterator,
	});

	try {
		const records = await dynamodbStreamsClient.send(getRecordsCommand);
		const shardIteratorNext = records.NextShardIterator;

		for (const record of records.Records) {
			processDynamoDBStream(record, app);
		}

		await readStream(shardIteratorNext, app);
	} catch (error) {
		throw new Error(`Error reading from the stream:, ${error}`);
	}
};

const getShardIterator = async (app: Express) => {
	const streamArn = STREAM_ARN_TABLE;

	const describeStreamCommand = new DescribeStreamCommand({
		StreamArn: streamArn,
	});

	try {
		const streamInfo = await dynamodbStreamsClient.send(describeStreamCommand);
		const shardIteratorType = 'LATEST';
		const getShardIteratorCommand = new GetShardIteratorCommand({
			ShardId: streamInfo.StreamDescription.Shards[0].ShardId,
			ShardIteratorType: shardIteratorType,
			StreamArn: streamArn,
		});

		const iteratorResponse = await dynamodbStreamsClient.send(
			getShardIteratorCommand
		);
		const shardIterator = iteratorResponse.ShardIterator;

		await readStream(shardIterator, app);
	} catch (error) {
		throw new Error(`Error getting the shard iterator:, ${error}`);
	}
};

export const startDynamoDBStream = async (app: Express) => {
	try {
		await getShardIterator(app);
	} catch (error) {
		throw new Error(`startDynamoDBStream:, ${error}`);
	}
};
