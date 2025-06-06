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
      resizeMode: "contain",
      backgroundColor: "#FF6B00",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.livraisonabidjan.app",
      buildNumber: "1.0.0",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "Cette application utilise votre position pour trouver des livreurs et des commerçants à proximité.",
        NSLocationAlwaysUsageDescription:
          "Cette application utilise votre position pour le suivi des livraisons en temps réel.",
        NSMicrophoneUsageDescription: "Cette application utilise le microphone pour l'assistant vocal.",
        NSCameraUsageDescription:
          "Cette application utilise la caméra pour scanner les codes QR et prendre des photos des colis.",
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FF6B00",
      },
      package: "com.livraisonabidjan.app",
      versionCode: 1,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "VIBRATE",
      ],
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
  },
}
