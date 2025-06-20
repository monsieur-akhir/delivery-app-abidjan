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

module.exports = config;
