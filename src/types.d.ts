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