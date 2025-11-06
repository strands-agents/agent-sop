// Node.js test environment setup
const { TextEncoder, TextDecoder } = require('util');

// Polyfill TextEncoder/TextDecoder for Node.js tests
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
