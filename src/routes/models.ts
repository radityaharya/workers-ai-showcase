import { CORS_HEADERS } from '../constants';
import { createErrorResponse } from '../utils';
export default async function handleModelRequest(request: Request, env: Env) {
	try {
		if (request.method !== 'GET') {
			return createErrorResponse(405, 'Invalid request method.', { method: request.method });
		}

		const models = {
			object: 'list',
			data: [
				{
					id: '@hf/thebloke/llamaguard-7b-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@hf/thebloke/neural-chat-7b-v3-1-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@cf/meta/llama-2-7b-chat-fp16',
					object: 'model',
					created: 1686935002,
					owned_by: '@cf/meta',
				},
				{
					id: '@cf/mistral/mistral-7b-instruct-v0.1',
					object: 'model',
					created: 1686935002,
					owned_by: '@cf/mistral',
				},
				{
					id: '@hf/thebloke/codellama-7b-instruct-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@cf/meta/llama-2-7b-chat-int8',
					object: 'model',
					created: 1686935002,
					owned_by: '@cf/meta',
				},
				{
					id: '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@hf/thebloke/llama-2-13b-chat-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@hf/thebloke/deepseek-coder-6.7b-base-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@hf/thebloke/openhermes-2.5-mistral-7b-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
				{
					id: '@hf/thebloke/zephyr-7b-beta-awq',
					object: 'model',
					created: 1686935002,
					owned_by: '@hf/thebloke',
				},
			],
		};

		return new Response(JSON.stringify(models), {
			headers: {
				'content-type': 'application/json',
				...CORS_HEADERS,
			},
		});
	} catch (error: any) {
		console.error(`Error fetching AI response: ${error}`);
		return createErrorResponse(500, 'An error occurred while fetching the AI response.', { error: error.message });
	}
}
