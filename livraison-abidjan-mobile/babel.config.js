module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugin pour gérer les optional chaining et nullish coalescing
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      // Plugin pour une meilleure gestion des erreurs runtime
      'react-native-reanimated/plugin',
    ],
  };
};