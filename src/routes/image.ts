import { Ai } from '@cloudflare/ai';
import { DEFAULT_AUDIO_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_MODEL, DEFAULT_STREAM, CORS_HEADERS } from '../constants';
import { createErrorResponse } from '../utils';
export default async function handleImageGeneration(request: Request, env: Env) {
	try {
		const url = new URL(request.url);
		let prompt: string;
		let model: string = DEFAULT_IMAGE_MODEL;

		if (request.method === 'POST') {
			if (request.headers.get('Authorization') !== "Bearer " + env.SECRET_KEY) {
				return createErrorResponse(401, 'Invalid authorization key.');
			}

			if (!request.body) {
				return createErrorResponse(400, 'No request body provided.');
			}

			const requestData = (await request.json()) as ImageRequestData;
			prompt = requestData.prompt;
			model = requestData.model || model;
		} else if (request.method === 'GET') {
			if (request.headers.get('user-agent') !== env.SECRET_KEY) {
				return createErrorResponse(401, 'Invalid authorization key.');
			}
			prompt = url.searchParams.get('prompt') || '';
		} else {
			return createErrorResponse(405, 'Invalid request method.', { method: request.method });
		}

		if (!prompt) {
			return createErrorResponse(400, 'No prompt provided.');
		}

		const inputs = {
			prompt,
	};

		const ai = new Ai(env.AI);
		const response = await ai.run("@cf/stabilityai/stable-diffusion-xl-base-1.0", inputs);

		const headers = { 'content-type': 'image/png' };
		return new Response(response, {
			headers: {
				...CORS_HEADERS,
				...headers,
			},
		});
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}