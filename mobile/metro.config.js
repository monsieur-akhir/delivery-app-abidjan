const { getDefaultConfig } = require("expo/metro-config")

const config = getDefaultConfig(__dirname)

// Ajouter la prise en charge des fichiers SVG
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer")
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg")
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"]

// Ajouter la prise en charge des fichiers .mjs
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs"]

module.exports = config
