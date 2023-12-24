import { Ai } from '@cloudflare/ai';
import template from './template.html';

interface Env {
	AI: any;
	SECRET_KEY: string;
}

interface MessageRequestData {
	messages: Message[];
	model: '@cf/meta/llama-2-7b-chat-fp16' | '@cf/meta/llama-2-7b-chat-int8' | '@cf/mistral/mistral-7b-instruct-v0.1';
	stream: boolean;
	max_tokens: number;
}

interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface ImageRequestData {
	prompt: string;
	model: '@cf/stabilityai/stable-diffusion-xl-base-1.0';
}

const DEFAULT_MODEL = '@cf/meta/llama-2-7b-chat-int8';
const DEFAULT_STREAM = false;
const DEFAULT_MAX_TOKENS = 256;

const DEFAULT_IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

const DEFAULT_AUDIO_MODEL = '@cf/openai/whisper';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	'Access-Control-Max-Age': '86400',
};

function createErrorResponse(status: number, message: string, additionalData: any = {}) {
	return new Response(
		JSON.stringify({
			status: 'error',
			message,
			...additionalData,
		}),
		{
			status,
			headers: { 'Content-Type': 'application/json' },
		}
	);
}

async function handleChatCompletions(request: Request, env: Env) {
	try {
		if (request.method !== 'POST') {
			return createErrorResponse(405, 'Invalid request method.', { method: request.method });
		}

		if (request.headers.get('Authorization') !== env.SECRET_KEY) {
			return createErrorResponse(401, 'Invalid authorization key.');
		}

		if (!request.body) {
			return createErrorResponse(400, 'No request body provided.');
		}

		const requestData = (await request.json()) as MessageRequestData;
		console.log(`Request data: ${JSON.stringify(requestData, null, 2000)}`);

		const messages = requestData.messages;
		const model = requestData.model || DEFAULT_MODEL;
		const stream = requestData.stream || DEFAULT_STREAM;
		const max_tokens = requestData.max_tokens || DEFAULT_MAX_TOKENS;

		if (!messages) {
			return createErrorResponse(400, 'No messages provided.');
		}

		console.log(`Last message: ${messages[messages.length - 1].content}`);

		const input = {
			messages: messages.map((message) => ({
				...message,
				content: typeof message.content === 'object' ? JSON.stringify(message.content) : message.content,
			})),
			stream,
			max_tokens: parseInt(max_tokens.toString()),
		};

		// console.log(`Input: ${JSON.stringify(input, null, 2)}`);
		const ai = new Ai(env.AI);
		const response = await ai.run(model, input);

		const headers = stream ? { 'content-type': 'text/event-stream' } : { 'content-type': 'application/json' };
		if (stream) {
			console.log(`Streamed response: ${response}`);
			return new Response(response, {
				headers: {
					...corsHeaders,
					...headers,
				},
			});
		} else {
			const uuidv4 = () => {
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
					var r = (Math.random() * 16) | 0,
						v = c == 'x' ? r : (r & 0x3) | 0x8;
					return v.toString(16);
				});
			};
			const formatedResponse = {
				id: 'chatcmpl-' + uuidv4(),
				object: 'chat.completion',
				created: new Date().getTime(),
				model: model,
				system_fingerprint: 'fp' + Math.random().toString(36).substring(2, 11),
				choices: [
					{
						index: 0,
						message: {
							role: 'assistant',
							content: JSON.stringify(response.response),
						},
						logprobs: null,
						finish_reason: 'stop',
					},
				],
				usage: {
					prompt_tokens: 9,
					completion_tokens: 12,
					total_tokens: 21,
				},
			};
			return new Response(JSON.stringify(formatedResponse), {
				headers: {
					...corsHeaders,
					...headers,
				},
			});
		}
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}

async function handleImageGeneration(request: Request, env: Env) {
	try {
		const url = new URL(request.url);
		let prompt: string;
		let model: string = DEFAULT_IMAGE_MODEL;

		if (request.method === 'POST') {
			if (request.headers.get('Authorization') !== env.SECRET_KEY) {
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

		const input = {
			prompt,
		};

		const ai = new Ai(env.AI);
		const response = await ai.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', input);

		const headers = { 'content-type': 'image/png' };
		return new Response(response, {
			headers: {
				...corsHeaders,
				...headers,
			},
		});
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}

async function handleTranscription(request: Request, env: Env) {
	try {
		let prompt: string;
		let model: string = DEFAULT_AUDIO_MODEL;

		if (request.method === 'POST') {
			if (request.headers.get('Authorization') !== env.SECRET_KEY) {
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
					...corsHeaders,
					...headers,
				},
			}
		);
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}
export default {
	/**
	 * Fetches a response from the AI based on the request and environment provided.
	 * @param {Request} request - The request object.
	 * @param {Env} env - The environment object.
	 * @return {Promise<Response>} The response from the AI.
	 */
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		switch (url.pathname) {
			case '/api/v1/chat/completions':
				return handleChatCompletions(request, env);
			case '/api/v1/image':
				return handleImageGeneration(request, env);
			case '/api/v1/audio/transcriptions':
				return handleTranscription(request, env);
			case '/':
				return new Response(template, {
					headers: { 'Content-Type': 'text/html' },
				});
			default:
				return createErrorResponse(404, 'Not found.');
		}
	},
};
