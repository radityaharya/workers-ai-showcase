import { Hono } from 'hono';
import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { createErrorResponse } from '../utils';

export interface Env {
	PINECONE_API_KEY: string;
	PINECONE_ENVIRONMENT: string;
}

interface PineconeRecord<RecordMetadata> {
	id: string;
	vector: number[];
	values: any; // The type of `values` depends on your specific use case
	metadata: RecordMetadata;
}

const DEFAULT_INDEX = 'example-index';

type Bindings = {
	AI: any;
	SECRET_KEY: string;
	PINECONE_API_KEY: string;
	PINECONE_ENVIRONMENT: string;
};

export const pineconeRoute = new Hono<{ Bindings: Bindings }>();

// const pinecone = new Pinecone({ apiKey: env.PINECONE_API_KEY, environment: env.PINECONE_ENVIRONMENT });

pineconeRoute.onError((err, c) => {
	console.log(`caught error: ${err}`);
	return c.json({ err: err }, 500);
});

// Create an index
pineconeRoute.post('/indexes/:name', async (c) => {
	try {
		const pinecone = new Pinecone({ apiKey: c.env.PINECONE_API_KEY, environment: c.env.PINECONE_ENVIRONMENT });
		let resp = await pinecone.createIndex({
			name: c.req.param('name') || DEFAULT_INDEX,
			dimension: 4,
		});
	} catch (e: any) {
		return createErrorResponse(400, 'Invalid request body.', { error: e.message });
	}
	return c.json({
		message: 'success',
	});
});

// List indexes
pineconeRoute.get('/indexes', async (c) => {
	const pinecone = new Pinecone({ apiKey: c.env.PINECONE_API_KEY, environment: c.env.PINECONE_ENVIRONMENT });
	const indexList = await pinecone.listIndexes();
	return c.json(indexList);
});

// Describe an index
pineconeRoute.get('/indexes/:name', async (c) => {
	const pinecone = new Pinecone({ apiKey: c.env.PINECONE_API_KEY, environment: c.env.PINECONE_ENVIRONMENT });
	const indexDescription = await pinecone.describeIndex(c.req.param('name') || DEFAULT_INDEX);
	return c.json(indexDescription);
});

// Upsert a new vector into an index
pineconeRoute.post('/indexes/:name/upsert', async (c) => {
	try {
		const pinecone = new Pinecone({ apiKey: c.env.PINECONE_API_KEY, environment: c.env.PINECONE_ENVIRONMENT });
		const index = pinecone.Index(c.req.param('name') || DEFAULT_INDEX);
		// const upsertRequest: PineconeRecord<RecordMetadata>[] = [
		//   {
		//     id: "movie1",
		//     vector: [0.1, 0.2, 0.3, 0.4],
		//     values: {}, // Add appropriate values here
		//     metadata: {
		//       title: "Movie 1",
		//       genre: "action",
		//     },
		//   },
		// ];

		const upsertRequest = (await c.req.json()) as PineconeRecord<RecordMetadata>[];

		const upsertResponse = await index.upsert(upsertRequest);
		return c.json({
			message: 'success',
		});
	} catch (e: any) {
		return createErrorResponse(400, 'Invalid request body.', { error: e.message });
	}
});

// Query an index
pineconeRoute.get('/indexes/:name/query', async (c) => {
	const pinecone = new Pinecone({ apiKey: c.env.PINECONE_API_KEY, environment: c.env.PINECONE_ENVIRONMENT });
	const index = pinecone.Index(c.req.param('name') || DEFAULT_INDEX);
	// const queryRequest = {
	//   vector: [0.1, 0.2, 0.3, 0.4],
	//   topK: 10,
	//   includeValues: true,
	//   includeMetadata: true,
	//   filter: {
	//     genre: { $in: ['comedy', 'documentary', 'drama'] },
	//   },
	//   namespace: 'example-namespace',
	// };

	const queryRequest = await c.req.json();

	const queryResponse = await index.query(queryRequest);
	return c.json(queryResponse);
});

// Show available routes
pineconeRoute.get('/', async (c) => {
	return c.json(pineconeRoute.routes);
});
