import { Ai } from '@cloudflare/ai';
import { DEFAULT_AUDIO_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_MODEL, DEFAULT_STREAM, CORS_HEADERS } from '../constants';
import { createErrorResponse } from '../utils';
export default async function handleTranscription(request: Request, env: Env) {
	try {
		let prompt: string;
		let model: string = DEFAULT_AUDIO_MODEL;

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
		} else {
			return createErrorResponse(405, 'Invalid request method.', { method: request.method });
		}

		if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
			return createErrorResponse(400, 'Invalid content type.');
		}

		const formData = await request.formData();
		const audio = formData.get('file') as unknown as File;
		if (!audio) {
			return createErrorResponse(400, 'No audio file provided.');
		}

		const audioBuffer = await audio.arrayBuffer();
		const input = {
			audio: [...new Uint8Array(audioBuffer)],
		};

		const ai = new Ai(env.AI);
		const response = await ai.run('@cf/openai/whisper', input);

		const headers = { 'content-type': 'image/png' };
		return new Response(
			JSON.stringify({
				text: response.text,
			} as any),
			{
				headers: {
					...CORS_HEADERS,
					...headers,
				},
			}
		);
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}