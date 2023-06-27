const axios = require('axios');

async function makeRequest(url) {
	try {
		const response = await axios.get(url);
		return response.data;
	} catch (error) {
		throw new Error(`Error making request to ${url}: ${error.message}`);
	}
}

async function makeParallelRequests() {
	try {
		const urls = [
			'http://localhost:3000/noApiKey',
			'http://localhost:3000/noApiKey',
			'http://localhost:3000/noApiKey',
			'http://localhost:3000/noApiKey',
		];

		const requests = urls.map((url) => makeRequest(url));
		const responses = await Promise.allSettled(requests);

		responses.forEach((response, index) => {
			if (response.status === 'fulfilled' && response.value) {
				console.log(`✅ Request ${index + 1} succeeded:`, response.value);
			} else {
				console.log(`❌ Request ${index + 1} failed:`, response.value);
			}
		});
	} catch (error) {
		console.error('Error making parallel requests:', error.message);
		// throw error;
	}
}

makeParallelRequests();
