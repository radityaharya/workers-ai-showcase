const DEFAULT_MODEL = '@hf/thebloke/openhermes-2.5-mistral-7b-awq';
const DEFAULT_STREAM = false;
const DEFAULT_MAX_TOKENS = 256;

const DEFAULT_IMAGE_MODEL = '@cf/stabilityai/stable-diffusion-xl-base-1.0';

const DEFAULT_AUDIO_MODEL = '@cf/openai/whisper';

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	'Access-Control-Max-Age': '86400',
};


export { DEFAULT_AUDIO_MODEL, DEFAULT_IMAGE_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_MODEL, DEFAULT_STREAM, CORS_HEADERS };