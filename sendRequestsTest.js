const http = require('http');

const ipAddresses = [
	'172.16.0.3',
	'172.16.0.3',
	'172.16.0.3',
	'172.16.0.1',
	'192.168.0.2',
	'10.0.0.3',
	'10.0.0.3',
	'192.168.0.3',
	'192.168.0.1',
	'10.0.0.1',
	'192.168.0.1',
	'10.0.0.1',
];
const endpoint = 'http://localhost:3000/';

function sendRequest(ip) {
	const options = {
		hostname: 'localhost',
		port: 3000,
		// path: '/apiKey',
		// path: '/noApiKey',
		path: '/apiKey?apiKey=2',
		method: 'GET',
		headers: {
			'X-Forwarded-For': ip,
		},
	};

	const req = http.request(options, (res) => {
		let data = '';

		res.on('data', (chunk) => {
			data += chunk;
		});

		res.on('end', () => {
			let message = data.includes('limiter') ? data : `Successful ✅`;
			console.log(`Response from ${ip}: ${message}`);
		});
	});

	req.on('error', (error) => {
		console.error(`Error occurred for ${ip}: ${error}`);
	});

	req.end();
}

function sendRequests() {
	for (const ip of ipAddresses) {
		sendRequest(ip);
	}
}

sendRequests();
