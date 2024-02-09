import { Ai } from '@cloudflare/ai';
import { DEFAULT_AUDIO_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_MODEL, DEFAULT_STREAM, CORS_HEADERS } from '../../constants';
import { createErrorResponse } from '../../utils';
import { Pinecone } from "@pinecone-database/pinecone";

export default async function handleChatCompletionsRAG(request: Request, env: Env) {
	try {
		if (request.method !== 'POST') {
			return createErrorResponse(405, 'Invalid request method.', { method: request.method });
		}

		if (request.headers.get('Authorization') !== "Bearer " + env.SECRET_KEY) {
			return createErrorResponse(401, 'Invalid authorization key.');
		}

		if (!request.body) {
			return createErrorResponse(400, 'No request body provided.');
		}

    const pinecone = new Pinecone();

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
		const lastMessage = messages[messages.length - 1].content

		const ai = new Ai(env.AI);


		const embeddings = await ai.run('@cf/baai/bge-base-en-v1.5', { text: lastMessage } as any);
		const vectors = embeddings.data[0]


		const index = pinecone.Index("context");

		const context = await index.query(vectors);

		const input = {
			messages: messages.map((message) => ({
				...message,
				content: typeof message.content === 'object' ? JSON.stringify(message.content) : message.content,
			})),
			stream,
			max_tokens: parseInt(max_tokens.toString()),
		};

		const response = await ai.run(model, input);

		const headers = stream ? { 'content-type': 'text/event-stream' } : { 'content-type': 'application/json' };
		if (stream) {
			return new Response(response, {
				headers: {
					...CORS_HEADERS,
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
					...CORS_HEADERS,
					...headers,
				},
			});
		}
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}