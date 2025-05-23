import "react-native-gesture-handler/jestSetup"
import jest from "jest" // Declare the jest variable
import "@testing-library/jest-native/extend-expect"
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock"
import { NativeModules } from "react-native"

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage)

// Mock Expo Secure Store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve("test-token")),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

// Mock Expo SplashScreen
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}))

// Mock Expo Font
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  useFonts: jest.fn(() => [true, null]),
}))

// Mock NetInfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}))

// Mock Expo Audio
jest.mock("expo-av", () => ({
  Audio: {
    Recording: jest.fn().mockImplementation(() => ({
      prepareToRecordAsync: jest.fn(() => Promise.resolve()),
      startAsync: jest.fn(() => Promise.resolve()),
      stopAndUnloadAsync: jest.fn(() => Promise.resolve()),
      getURI: jest.fn(() => "file://test/audio.m4a"),
    })),
    Sound: {
      createAsync: jest.fn(() => Promise.resolve({ sound: { playAsync: jest.fn() } })),
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
    RECORDING_OPTIONS_PRESET_HIGH_QUALITY: {},
  },
}))

// Mock Expo Speech
jest.mock("expo-speech", () => ({
  speak: jest.fn(),
}))

// Mock Expo FileSystem
jest.mock("expo-file-system", () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve("base64string")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1000 })),
  EncodingType: {
    Base64: "base64",
  },
}))

// Mock Expo Location
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 5.3599517,
        longitude: -4.0082563,
        altitude: 0,
        accuracy: 10,
        altitudeAccuracy: 10,
        heading: 0,
        speed: 0,
      },
      timestamp: 1612345678000,
    }),
  ),
  watchPositionAsync: jest.fn(() => ({
    remove: jest.fn(),
  })),
  Accuracy: {
    Balanced: 3,
  },
}))

// Mock Expo ImagePicker
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: "granted" })),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      cancelled: false,
      assets: [{ uri: "file://test/image.jpg", width: 100, height: 100, type: "image" }],
    }),
  ),
  MediaTypeOptions: {
    Images: "Images",
  },
}))

// Mock Expo Constants
jest.mock("expo-constants", () => ({
  manifest: {
    extra: {
      apiUrl: "https://api.test.com",
      sentryDsn: "https://test@sentry.io/123",
    },
    developmentMode: true,
  },
  appOwnership: "expo",
  installationId: "test-installation-id",
}))

// Mock Sentry
jest.mock("sentry-expo", () => ({
  init: jest.fn(),
  Native: {
    captureException: jest.fn(),
  },
}))

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: "fr",
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: {
    type: "3rdParty",
    init: jest.fn(),
  },
}))

// Mock react-navigation
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
  }),
  useRoute: () => ({
    params: {
      deliveryId: 1,
      courierId: 1,
    },
  }),
  useIsFocused: () => true,
}))

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
  }),
)

// Mock timers
jest.useFakeTimers()

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock")
  Reanimated.default.call = () => {}
  return Reanimated
})

// Mock react-native-maps
jest.mock("react-native-maps", () => {
  const React = require("react")
  const MapView = (props) => {
    return React.createElement("MapView", props, props.children)
  }
  const Marker = (props) => {
    return React.createElement("Marker", props, props.children)
  }
  const Polyline = (props) => {
    return React.createElement("Polyline", props, props.children)
  }
  MapView.Marker = Marker
  MapView.Polyline = Polyline
  return {
    __esModule: true,
    default: MapView,
    Marker,
    Polyline,
    PROVIDER_GOOGLE: "google",
  }
})

// Silence the warning: Animated: `useNativeDriver` is not supported
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper")

// Mock the RNCNetInfo module
NativeModules.RNCNetInfo = {
  getCurrentState: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}
