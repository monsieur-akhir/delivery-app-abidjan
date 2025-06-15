import "dotenv/config"

export default {
  expo: {
    name: "Livraison Abidjan",
    slug: "livraison-abidjan",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#FF6B00",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.livraisonabidjan.app",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.livraisonabidjan.app",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Autoriser Livraison Abidjan à utiliser votre position.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#FF6B00",
        },
      ],
      "expo-localization",
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
      apiUrl: process.env.API_URL,
      wsUrl: process.env.WS_URL,
      environment: process.env.ENVIRONMENT,
    },
    platforms: ["ios", "android"],
  },
}