import { createServer } from 'http';

const port = process.env.PORT || 8000;

const httpServer = createServer((req, res) => {
	res.writeHead(200);
	res.end('Hello world.');
});

export function startHttpServer() {
	httpServer.listen(port, () => {
		console.log(`Http server listening on port ${port}`);
	});
}
