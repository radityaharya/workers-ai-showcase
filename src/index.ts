import { Ai } from '@cloudflare/ai';
import template from './template.html';
import tailwind from './css/tailwind.min.css';

interface Env {
	AI: any;
	SECRET_KEY: string;
}

interface RequestData {
	messages: Message[];
	model:
		| '@cf/meta/llama-2-7b-chat-fp16'
		| '@cf/meta/llama-2-7b-chat-int8'
		| '@cf/mistral/mistral-7b-instruct-v0.1'
		| '@hf/codellama/codellama-7b-hf';
	stream: boolean;
	max_tokens: number;
}

interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

const DEFAULT_MODEL = '@cf/meta/llama-2-7b-chat-int8';
const DEFAULT_STREAM = false;
const DEFAULT_MAX_TOKENS = 256;

export default {
	/**
	 * Fetches a response from the AI based on the request and environment provided.
	 * @param {Request} request - The request object.
	 * @param {Env} env - The environment object.
	 * @return {Promise<Response>} The response from the AI.
	 */
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		cases: switch (url.pathname) {
			case '/api/ai':
				try {
					const ai = new Ai(env.AI);

					if (request.method !== 'POST') {
						return new Response(
							JSON.stringify({
								status: 'error',
								message: 'Invalid request method.',
								method: request.method,
							}),
							{
								status: 405,
								headers: { 'Content-Type': 'application/json' },
							}
						);
					}

					if (request.headers.get('Authorization') !== env.SECRET_KEY) {
						return new Response(
							JSON.stringify({
								status: 'error',
								message: 'Invalid authorization key.',
							}),
							{
								status: 401,
								headers: { 'Content-Type': 'application/json' },
							}
						);
					}

					if (!request.body) {
						return new Response(
							JSON.stringify({
								status: 'error',
								message: 'No request body provided.',
							}),
							{
								status: 400,
								headers: { 'Content-Type': 'application/json' },
							}
						);
					}

					const requestData = await request.json();
					const { messages, model = DEFAULT_MODEL, stream = DEFAULT_STREAM, max_tokens = DEFAULT_MAX_TOKENS } = requestData as RequestData;

					if (!messages) {
						return new Response(
							JSON.stringify({
								status: 'error',
								message: 'No messages provided.',
							}),
							{
								status: 400,
								headers: { 'Content-Type': 'application/json' },
							}
						);
					}

					console.log(`Last message: ${messages[messages.length - 1].content}`);

					const input = {
						messages,
						stream,
						max_tokens: parseInt(max_tokens.toString()),
					};
					console.log(`Input: ${JSON.stringify(input, null, 2)}`);
					const response = await ai.run(model, input);

					const corsHeaders = {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
						'Access-Control-Max-Age': '86400',
					};

					const headers = stream ? { 'content-type': 'text/event-stream' } : { 'content-type': 'application/json' };
					if (stream) {
						return new Response(response, {
							headers: {
								...corsHeaders,
								...headers,
							},
						});
					} else {
						return new Response(JSON.stringify(response), {
							headers: {
								...corsHeaders,
								...headers,
							},
						});
					}
				} catch (error: any) {
					console.error(`Error fetching AI response: ${error}`);
					return new Response(
						JSON.stringify({
							status: 'error',
							message: 'An error occurred while fetching the AI response.',
							error: error.message,
						}),
						{
							status: 500,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
			case '/':
				return new Response(template, {
					headers: { 'Content-Type': 'text/html' },
				});
			default:
				return new Response("Not found.", {
					status: 404,
					headers: { 'Content-Type': 'text/plain' },
				});
		}
	},
};
