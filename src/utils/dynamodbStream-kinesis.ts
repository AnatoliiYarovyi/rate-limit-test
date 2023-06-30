import { Express } from 'express';
import { DynamoDBStreamsClient, DescribeStreamCommand } from '@aws-sdk/client-dynamodb-streams';
import {
	KinesisClient,
	GetRecordsCommand,
	GetShardIteratorCommand,
	_Record,
} from '@aws-sdk/client-kinesis';

const { REGION, STREAM_ARN_TABLE } = process.env;

const ddbStreamsClient = new DynamoDBStreamsClient({ region: REGION });
const kinesisClient = new KinesisClient({ region: REGION });

const processDynamoDBStreamRecord = (record: _Record, app: Express) => {
  console.log('apiKeysCacheOld:', app.locals.apiKeysCache);
  console.log('record', record);
  

	// const apiKey = record.Data.keys.apiKey.S;
	// const { id, limit } = record.dynamodb.NewImage;

	// const index = app.locals.apiKeysCache.findIndex(
	// 	(apiKeyData: ApiKeysCache) => apiKeyData.apiKey === apiKey 
	// );

	// if (index >= 0) {
	// 	app.locals.apiKeysCache[index].limit = +limit.N;
	// } else {
	// 	app.locals.apiKeysCache.push({
	// 		id: id.S,
	// 		apiKey,
	// 		limit: +limit.N,
	// 	});
	// }

	console.log('apiKeysCacheNew:', app.locals.apiKeysCache);
};

const startDynamoDBStream = async (app: Express) => {
	const describeStreamCommand = new DescribeStreamCommand({
		StreamArn:
			'arn:aws:dynamodb:us-east-1:513476794027:table/api-keys-test-serverless/stream/2023-06-29T14:34:42.580',
		Limit: 100,
	});

	try {
		const { StreamDescription } = await ddbStreamsClient.send(describeStreamCommand);
		const shardId = StreamDescription.Shards[0].ShardId;

		const processRecords = async (shardIterator?: string) => {
			const getRecordsCommand = new GetRecordsCommand({
				ShardIterator: shardIterator!,
				Limit: 100,
			});

			try {
				const { Records, NextShardIterator } = await kinesisClient.send(getRecordsCommand);

				Records?.forEach((record) => {
					processDynamoDBStreamRecord(record, app);
				});

				processRecords(NextShardIterator);
			} catch (err) {
				console.error('Error getting records from Kinesis:', err);
			}
		};

		const getShardIteratorCommand = new GetShardIteratorCommand({
			StreamName: StreamDescription.StreamArn!.split('/')[1],
			ShardId: shardId!,
			ShardIteratorType: 'LATEST',
		});

		try {
			const { ShardIterator } = await kinesisClient.send(getShardIteratorCommand);
			processRecords(ShardIterator);
		} catch (err) {
			console.error('Error getting Kinesis shard iterator:', err);
		}
	} catch (err) {
		console.error('Error describing DynamoDB stream:', err);
	}
};

export { startDynamoDBStream };
