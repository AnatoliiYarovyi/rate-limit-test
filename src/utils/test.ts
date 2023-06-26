import axios from 'axios';

async function makeRequest(url: string): Promise<any> {
	try {
		const response = await axios.get(url);
		console.log('response.data', response);
		return response.data;
	} catch (error) {
		console.error(`Error making request to ${url}: ${error.message}`);
	}
}

async function makeParallelRequests(): Promise<void> {
	try {
		const urls = [
			'http://localhost:3000/keys?apiKey=2',
			'http://localhost:3000/keys?apiKey=2',
			'http://localhost:3000/keys?apiKey=2',
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

export default makeParallelRequests
