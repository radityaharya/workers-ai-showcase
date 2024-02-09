// import { Ai } from '@cloudflare/ai';
// import { createErrorResponse } from '../utils';

// export default async function handleEmbedings(request: Request, env: Env) {
// 	const ai = new Ai(env.AI);
// 	let error = null;

// 	try {
// 		if (request.headers.get('Content-Type') === 'application/json') {
// 			const json = await request.json() as any;

// 			const embeddings = await ai.run('@cf/baai/bge-base-en-v1.5', {
// 				text: json.input,
// 			});

// 			return Response.json({
// 				object: 'list',
// 				data: [
// 					{
// 						object: 'embedding',
// 						embedding: embeddings.data[0],
// 						index: 0,
// 					},
// 				],
// 				"model": "bge-base-en-v1.5",
// 				usage: {
// 					prompt_tokens: 0,
// 					total_tokens: 0,
// 				},
// 			});
// 		}
// 	} catch (e) {
// 		error = e;
// 	}

// 	// if there is no header or it's not json, return an error
//   return createErrorResponse(400, 'Invalid request body.', { error: error.message });

// 	// if we get here, return a 400 error
// 	return Response.json({ error: 'invalid request' }, { status: 400 });
// };

import { Ai } from '@cloudflare/ai';
import { DEFAULT_AUDIO_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_MODEL, DEFAULT_STREAM, CORS_HEADERS } from '../constants';
import { createErrorResponse } from '../utils';
export default async function handleEmbeddings(request: Request, env: Env) {
	try {
		let input: string;
		let model: string = DEFAULT_AUDIO_MODEL;

		if (request.method === 'POST') {
			if (request.headers.get('Authorization') !== "Bearer " + env.SECRET_KEY) {
				return createErrorResponse(401, 'Invalid authorization key.');
			}

			if (!request.body) {
				return createErrorResponse(400, 'No request body provided.');
			}

			const requestData = (await request.json()) as {
        input: string;
        model?: string;
      };
      
			input = requestData.input;
			model = requestData.model || model;
		} else {
			return createErrorResponse(405, 'Invalid request method.', { method: request.method });
		}

		if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
			return createErrorResponse(400, 'Invalid content type.');
		}


		const ai = new Ai(env.AI);
		const response = await ai.run('@cf/baai/bge-base-en-v1.5', {
      text: input,
    } as any);

		const headers = { 'content-type': 'image/png' };
		return new Response(
			JSON.stringify({
				object: 'list',
				data: [
					{
						object: 'embedding',
						embedding: response.data[0],
						index: 0,
					},
				],
				model,
				usage: {
					prompt_tokens: 0,
					total_tokens: 0,
				}
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