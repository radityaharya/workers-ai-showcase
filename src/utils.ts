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

export {createErrorResponse};