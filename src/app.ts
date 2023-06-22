import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import { startDynamoDBStream } from './utils/dynamodbStream';
import rateLimiter from './middlewares/rateLimiter';

import { getApiKeys } from './utils/getApiKeys';
import keys from './routes/keys';

const { PORT = 3000 } = process.env;
const app = express();

app.use(
	cors({
		origin: ['http://localhost:3001'],
		methods: ['HEAD', 'OPTIONS', 'POST', 'GET', 'PUT', 'PATCH', 'DELETE'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'Uppy-Versions',
			'Accept',
			'x-requested-with',
			'Access-Control-Allow-Origin',
		],
		exposedHeaders: ['Access-Control-Allow-Headers', 'Access-Control-Allow-Origin'],
		preflightContinue: false,
		optionsSuccessStatus: 204,
		credentials: true,
	})
);
app.use(rateLimiter());
app.use(express.json());
app.use(cookieParser());

app.use('/keys', keys);

app.use((_, res) => {
	res.status(404).json({ message: 'Not found' });
});

app.use((err, _, res, __) => {
	const { status = 500, message = 'Server error' } = err;
	res.status(status).json({ message });
});

async function initializeApp() {
	try {
		const result = await getApiKeys();
		// const result = 'Hello  world';
		app.locals.apiKeysCache = result;
	} catch (error) {
		console.error('initializeApp:', error);
	}
}

initializeApp()
	.then(async () => {
		try {
			app.listen(PORT, () => {
				console.info(`Server running. Use our API on port: ${PORT}`);
			});
			await startDynamoDBStream(app);
		} catch (error) {
			console.error('Error getting the shard iterator:', error);
			throw error;
		}
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
