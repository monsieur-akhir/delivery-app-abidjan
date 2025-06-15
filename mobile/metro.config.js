
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour SVG
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Configuration pour TypeScript
config.resolver.sourceExts.push('ts', 'tsx');

// Configuration pour éviter les erreurs Metro
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
