{
 "name": "silk-road-server",
 "version": "1.3.0",
 "private": true,
 "main": "server.js",
 "scripts": {
  "start": "node server.js",
  "test": "node test-gems.js && node test-world.js && node test-char.js"
 },
 "engines": {
  "node": ">=18"
 },
 "dependencies": {
  "ws": "^8.18.0"
 }
}
