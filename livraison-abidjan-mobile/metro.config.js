
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter les extensions TypeScript si nécessaire
config.resolver.sourceExts.push('ts', 'tsx');

// Configuration pour React Native Vector Icons
config.resolver.assetExts.push('ttf');

module.exports = config;
