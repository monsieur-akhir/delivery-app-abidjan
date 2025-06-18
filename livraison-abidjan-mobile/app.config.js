import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "Livraison Abidjan",
  slug: "livraison-abidjan-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#FF6B00"
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.livraisonabidjan.app",
    buildNumber: "1.0.0",
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "Cette application utilise votre position pour trouver des livreurs et des commerçants à proximité.",
      NSLocationAlwaysUsageDescription: "Cette application utilise votre position pour le suivi des livraisons en temps réel.",
      NSMicrophoneUsageDescription: "Cette application utilise le microphone pour l'assistant vocal.",
      NSCameraUsageDescription: "Cette application utilise la caméra pour scanner les codes QR et prendre des photos des colis."
    },
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FF6B00"
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
      "VIBRATE"
    ],
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID
      }
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Autoriser Livraison Abidjan à utiliser votre position."
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#FF6B00"
      }
    ],
    "expo-localization"
  ],
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID
    }
  },
  developmentClient: {
    silentLaunch: true
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  runtimeVersion: {
    policy: "sdkVersion"
  }
});
