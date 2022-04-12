const http = require('http');

const port = process.env.PORT || 8000;

const requestListener = function(req, res) {
	res.writeHead(200);
	res.end('Hello world.');
};

const httpServer = http.createServer(requestListener);
function startHttpServer() {
	httpServer.listen(port, () => {
		console.log(`Http server listening on port ${port}`);
	});
}

module.exports = { startHttpServer };
