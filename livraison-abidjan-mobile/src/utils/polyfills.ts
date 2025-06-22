// Polyfills pour les modules Node.js
import 'react-native-get-random-values';

// Polyfill pour Buffer
import { Buffer } from '@craftzdog/react-native-buffer';
global.Buffer = Buffer;

// Polyfill pour process
if (typeof global.process === 'undefined') {
  global.process = require('process');
}

// Polyfill pour crypto
if (typeof global.crypto === 'undefined') {
  global.crypto = require('react-native-get-random-values');
}

// Polyfill pour stream
if (typeof global.stream === 'undefined') {
  global.stream = require('readable-stream');
}

export {}; 