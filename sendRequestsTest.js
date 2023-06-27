const axios = require('axios');

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
const endpoint = 'http://localhost:3000/apiKey';
// const endpoint = 'http://localhost:3000/noApiKey';

async function sendRequest(ip) {
	try {
		const response = await axios.get(endpoint, {
			headers: {
				'X-Forwarded-For': ip,
				// 'x-api-key': 2
			},
		});

		let message = response.data.data ? `Successful` : response.data;
		console.log(`✅ Response from ${ip}: ${message}`);
	} catch (error) {
		if (error.response) {
			console.error(
				`❌ Error occurred for ${ip}: ${error.response.data} --> ${error.response.status}`
			);
		} else {
			console.error(`Error occurred for ${ip}: ${error.message}`);
		}
	}
}

async function sendRequests() {
	try {
		for (const ip of ipAddresses) {
			await sendRequest(ip);
		}
	} catch (error) {
		console.error('Error sending requests:', error);
	}
}

sendRequests();
