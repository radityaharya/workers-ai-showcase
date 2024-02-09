import template from './template.html';
import { Hono } from 'hono'
import { pineconeRoute } from './routes/pinecone';



import {
	handleChatCompletions,
	handleImageGeneration,
	handleTranscription,
	handleEmbeddings,
	handleModelRequest
} from './routes/route';


type Bindings = {
	AI: any;
	SECRET_KEY: string;
}

const app = new Hono<{ Bindings: Bindings }>()

const api = new Hono<{ Bindings: Bindings }>()


api.post('/chat/completions', async (c, next) => {
	return handleChatCompletions(c.req as unknown as Request, c.env)
})

api.post('/image', async (c, next) => {
	return handleImageGeneration(c.req as unknown as Request, c.env)
})

api.get('/image', async (c, next) => {
	return handleImageGeneration(c.req as unknown as Request, c.env)
})

api.post('/audio/transcriptions', async (c, next) => {
	return handleTranscription(c.req as unknown as Request, c.env)
})

api.post('/embeddings', async (c, next) => {
	return handleEmbeddings(c.req as unknown as Request, c.env)
})

api.get('/models', async (c, next) => {
	return handleModelRequest(c.req as unknown as Request, c.env)
})

api.get('/', async (c, next) => {
	return new Response(template, {
		headers: { 'Content-Type': 'text/html' },
	});
})

app.get('/', async (c, next) => {
	return new Response(template, {
		headers: { 'Content-Type': 'text/html' },
	});
})

api.route('/pinecone', pineconeRoute)
app.route('/api/v1', api)

export default app