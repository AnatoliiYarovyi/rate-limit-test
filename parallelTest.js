const http = require('http');

function makeRequest(url) {
	return new Promise((resolve, reject) => {
		const request = http.get(url, (response) => {
			let data = '';
			response.on('data', (chunk) => {
				data += chunk;
			});

			response.on('end', () => {
				if (response.statusCode >= 200 && response.statusCode < 300) {
					const jsonData = JSON.parse(data);
					resolve(jsonData);
				} else {
					reject(
						new Error(`Request to ${url} failed with status ${response.statusCode}`)
					);
				}
			});
		});

		request.on('error', (error) => {
			reject(new Error(`Error making request to ${url}: ${error.message}`));
		});
	});
}

async function makeParallelRequests() {
	try {
		const urls = [
			'http://localhost:3000/apiKey?apiKey=2',
			'http://localhost:3000/apiKey?apiKey=2',
			'http://localhost:3000/apiKey?apiKey=2',
		];

		const requests = urls.map((url) => makeRequest(url));
		const responses = await Promise.allSettled(requests);
		console.log('requests', requests);

		responses.forEach((response, index) => {
			if (response.status === 'fulfilled' && response.value) {
				console.log(`Request ${index + 1} succeeded:`, response.value);
			} else {
				console.log(`Request ${index + 1} failed:`, response);
			}
		});
	} catch (error) {
		console.error('Error making parallel requests:', error.message);
		// throw error;
	}
}

makeParallelRequests();
