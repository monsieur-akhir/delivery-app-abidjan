const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour éviter les erreurs de modules
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db'
);

config.resolver.sourceExts.push('js', 'json', 'ts', 'tsx', 'jsx');

// Transformer configuration pour gérer les erreurs JS
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
};

// Ajouter un resolver pour les modules problématiques
config.resolver.platforms = ['native', 'ios', 'android', 'web'];

module.exports = config;