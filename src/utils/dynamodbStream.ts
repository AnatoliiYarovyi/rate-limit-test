import { Express } from 'express';
import {
	DynamoDBStreamsClient,
	GetRecordsCommand,
	DescribeStreamCommand,
	GetShardIteratorCommand,
	_Record,
} from '@aws-sdk/client-dynamodb-streams';
import 'dotenv/config';

import { ApiKeysCache } from '../interfaces/App';
import makeParallelRequests from './test';

const { REGION, STREAM_ARN_TABLE } = process.env;

const dynamodbStreamsClient = new DynamoDBStreamsClient({ region: REGION });

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
	makeParallelRequests()
		.then((responses) => {
			console.log('Responses:', responses);
		})
		.catch((error) => {
			console.error('Error:', error.response.status);
		});
};

const readStream = async (shardIterator: string, app: Express) => {
	if (!shardIterator) {
		console.error('Invalid ShardIterator: Missing ShardIterator');
		// Возможно, выполните некоторые действия, такие как повторное получение итератора
		// или прекращение чтения потока
		return;
	}

	const getRecordsCommand = new GetRecordsCommand({
		ShardIterator: shardIterator,
	});

	try {
		const records = await dynamodbStreamsClient.send(getRecordsCommand);
		const shardIteratorNext = records.NextShardIterator;

		if (shardIteratorNext) {
			let maxDelay = 500;

			for (const record of records.Records) {
				processDynamoDBStream(record, app);

				if (record?.dynamodb?.ApproximateCreationDateTime) {
					const delay =
						Date.now() -
						new Date(record.dynamodb.ApproximateCreationDateTime).getTime();
					console.log('delay', delay);

					maxDelay = Math.max(maxDelay, delay);
				}
			}

			if (maxDelay > 0) {
				// Используйте максимальную задержку для определения времени задержки перед следующим чтением
				const delay = maxDelay;
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
			// console.log('start readStream');

			await readStream(shardIteratorNext, app);
		} else {
			// Обработка ошибки отсутствия действительного итератора шарда
			console.error('Invalid ShardIterator: Missing ShardIterator');
			// Возможно, выполните некоторые действия, такие как повторное получение итератора
			// или прекращение чтения потока
		}
	} catch (error) {
		console.error('Error reading from the stream:', error);
		// Обработка других ошибок чтения потока
		// Возможно, выполните некоторые действия, такие как повторное чтение или прекращение чтения потока
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
		const shardIds = streamInfo.StreamDescription.Shards.map((shard) => shard.ShardId);

		const readStreamPromises = shardIds.map(async (shardId) => {
			const getShardIteratorCommand = new GetShardIteratorCommand({
				ShardId: shardId,
				ShardIteratorType: shardIteratorType,
				StreamArn: streamArn,
			});

			const iteratorResponse = await dynamodbStreamsClient.send(getShardIteratorCommand);
			const shardIterator = iteratorResponse.ShardIterator;

			await readStream(shardIterator, app);
		});

		await Promise.all(readStreamPromises);
	} catch (error) {
		console.error('Error getting the shard iterator:', error);
		// Попробуйте выполнить обработку ошибок или повторить получение итератора
		// в зависимости от проблемы
	} finally {
		dynamodbStreamsClient.destroy();
		// Освободить ресурсы (например, закрыть соединение с DynamoDB Streams)
	}
};

export const startDynamoDBStream = async (app: Express) => {
	try {
		await getShardIterator(app);
	} catch (error) {
		console.error('startDynamoDBStream:', error);
		// Попробуйте выполнить обработку ошибок или повторить запуск потока
		// в зависимости от проблемы
	}
};
