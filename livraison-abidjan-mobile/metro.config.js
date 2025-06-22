const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour react-native-svg-transformer
config.transformer = config.transformer || {};
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = config.resolver.sourceExts || [];
if (!config.resolver.sourceExts.includes('svg')) config.resolver.sourceExts.push('svg');

// Ajouter les extensions TypeScript si nécessaire
if (!config.resolver.sourceExts.includes('ts')) config.resolver.sourceExts.push('ts');
if (!config.resolver.sourceExts.includes('tsx')) config.resolver.sourceExts.push('tsx');

// Configuration pour React Native Vector Icons
if (!config.resolver.assetExts.includes('ttf')) config.resolver.assetExts.push('ttf');

// Configuration pour résoudre les problèmes MIME avec Jimp et autres bibliothèques
config.resolver.assetExts.push('bin', 'dat', 'db', 'mp3', 'ttl', 'obj', 'png', 'jpg', 'jpeg', 'gif', 'webp');

// Configuration pour les modules qui utilisent des assets binaires
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configuration pour éviter les problèmes avec les modules Node.js
config.resolver.alias = {
  ...config.resolver.alias,
  'crypto': 'react-native-get-random-values',
  'stream': 'readable-stream',
  'buffer': '@craftzdog/react-native-buffer',
  'process': 'process',
  'util': 'util',
  'events': 'events',
  'path': 'path-browserify',
  'fs': false,
  'net': false,
  'tls': false,
  'child_process': false,
  'os': 'react-native-os',
};

// Configuration pour les modules qui causent des problèmes
config.resolver.blockList = [
  /.*\/node_modules\/.*\/node_modules\/react-native\/.*/,
];

// Configuration pour améliorer la résolution des modules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
