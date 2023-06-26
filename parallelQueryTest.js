const http = require('http');

const ipAddresses = ['192.168.0.1', '10.0.0.1', '172.16.0.1'];
const endpoint = 'http://localhost:3000/keys';

function sendRequest(ip) {
	const options = {
		hostname: 'localhost',
		port: 3000,
		path: '/keys',
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
			console.log(`Response from ${ip}: ${data}`);
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
