const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    const EventEmitter = require('events');
    const myEmitter = new EventEmitter();

    if (pathname === '/' || pathname === '/home') {
        // Serve an HTML file using fs and path
        const filePath = path.join(__dirname, 'index.html');
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else if (pathname === '/api/info') {
        // Serve JSON response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Hello from pure Node.js API!" }));
    } else if (pathname === '/events') {
        // Demonstrate EventEmitter module
        res.writeHead(200, { 'Content-Type': 'text/html' });
        
        // Listen to an event
        myEmitter.on('testEvent', () => {
            res.write('<p>The custom event "testEvent" was triggered and handled successfully!</p>');
        });
        
        res.write('<h1>Node.js Events Module Demonstration</h1>');
        // Trigger the event
        myEmitter.emit('testEvent');
        res.end();
    } else {
        // 404 Not Found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - Page Not Found</h1>');
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Experiment 7 (Node.js without Express) running on http://localhost:${PORT}`);
});
