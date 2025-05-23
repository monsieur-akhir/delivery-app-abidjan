"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { StatusBar, LogBox, View, Text, StyleSheet } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Provider as PaperProvider, DefaultTheme, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SplashScreen from "expo-splash-screen"
import * as Sentry from "sentry-expo"

// Contextes
import { AuthProvider } from "./contexts/AuthContext"
import { NetworkProvider } from "./contexts/NetworkContext"
import { WebSocketProvider } from "./contexts/WebSocketContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { NotificationProvider } from "./contexts/NotificationContext"

// Écrans d'authentification
import LoginScreen from "./screens/auth/LoginScreen"
import RegisterScreen from "./screens/auth/RegisterScreen"
import VerifyOTPScreen from "./screens/auth/VerifyOTPScreen"
import ForgotPasswordScreen from "./screens/auth/ForgotPasswordScreen"

// Écrans client
import ClientHomeScreen from "./screens/client/HomeScreen"
import CreateDeliveryScreen from "./screens/client/CreateDeliveryScreen"
import BidsScreen from "./screens/client/BidsScreen"
import TrackDeliveryScreen from "./screens/client/TrackDeliveryScreen"
import PaymentScreen from "./screens/client/PaymentScreen"
import MarketplaceScreen from "./screens/client/MarketplaceScreen"
import MerchantDetailsScreen from "./screens/client/MerchantDetailsScreen"
import RateDeliveryScreen from "./screens/client/RateDeliveryScreen"

// Écrans coursier
import CourierHomeScreen from "./screens/courier/HomeScreen"
import BidScreen from "./screens/courier/BidScreen"
import CourierTrackDeliveryScreen from "./screens/courier/CourierTrackDeliveryScreen"
import CourierEarningsScreen from "./screens/courier/CourierEarningsScreen"
import CourierStatusScreen from "./screens/courier/CourierStatusScreen"
import CourierStatsScreen from "./screens/courier/CourierStatsScreen"
import CollaborativeDeliveriesScreen from "./screens/courier/CollaborativeDeliveriesScreen"

// Écrans communs
import ProfileScreen from "./screens/profile/ProfileScreen"
import NotificationsScreen from "./screens/NotificationsScreen"
import SettingsScreen from "./screens/SettingsScreen"
import OnboardingScreen from "./screens/OnboardingScreen"

// Composants
import VoiceAssistant from "./components/VoiceAssistant"

// Configuration
import { SENTRY_DSN, ENVIRONMENT } from "./config/environment"
import type {
  RootStackParamList,
  ClientTabParamList,
  CourierTabParamList,
  ClientDeliveriesParamList,
  CourierDeliveriesParamList,
} from "./types/navigation"

// Initialiser Sentry
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    enableInExpoDevelopment: true,
    debug: ENVIRONMENT !== "production",
    environment: ENVIRONMENT,
  })
}

// Ignorer certains avertissements
LogBox.ignoreLogs(["ViewPropTypes will be removed", "ColorPropType will be removed"])

// Maintenir l'écran de démarrage visible
SplashScreen.preventAutoHideAsync().catch(() => {})

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<ClientTabParamList | CourierTabParamList>()
const ClientDeliveriesStack = createNativeStackNavigator<ClientDeliveriesParamList>()
const CourierDeliveriesStack = createNativeStackNavigator<CourierDeliveriesParamList>()

// Thème de l'application
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF6B00",
    accent: "#4CAF50",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    error: "#F44336",
    text: "#212121",
    disabled: "#BDBDBD",
    placeholder: "#9E9E9E",
    backdrop: "rgba(0, 0, 0, 0.5)",
  },
}

// Navigateur d'onglets pour les clients
const ClientTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          if (route.name === "Home") {
            iconName = "home"
          } else if (route.name === "Deliveries") {
            iconName = "package"
          } else if (route.name === "Marketplace") {
            iconName = "shopping"
          } else if (route.name === "Profile") {
            iconName = "account"
          } else {
            iconName = "circle"
          }

          return <IconButton icon={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={ClientHomeScreen} options={{ title: i18n.t("tabs.home") }} />
      <Tab.Screen
        name="Deliveries"
        component={ClientDeliveriesNavigator}
        options={{ title: i18n.t("tabs.deliveries") }}
      />
      <Tab.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: i18n.t("tabs.marketplace") }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: i18n.t("tabs.profile") }} />
    </Tab.Navigator>
  )
}

// Navigateur d'onglets pour les coursiers
const CourierTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string

          if (route.name === "Home") {
            iconName = "home"
          } else if (route.name === "Deliveries") {
            iconName = "package"
          } else if (route.name === "Earnings") {
            iconName = "cash"
          } else if (route.name === "Profile") {
            iconName = "account"
          } else {
            iconName = "circle"
          }

          return <IconButton icon={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={CourierHomeScreen} options={{ title: i18n.t("tabs.home") }} />
      <Tab.Screen
        name="Deliveries"
        component={CourierDeliveriesNavigator}
        options={{ title: i18n.t("tabs.deliveries") }}
      />
      <Tab.Screen name="Earnings" component={CourierEarningsScreen} options={{ title: i18n.t("tabs.earnings") }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: i18n.t("tabs.profile") }} />
    </Tab.Navigator>
  )
}

// Navigateur pour les livraisons des clients
const ClientDeliveriesNavigator: React.FC = () => {
  return (
    <ClientDeliveriesStack.Navigator screenOptions={{ headerShown: false }}>
      <ClientDeliveriesStack.Screen name="DeliveriesList" component={ClientDeliveriesScreen} />
      <ClientDeliveriesStack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
      <ClientDeliveriesStack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <ClientDeliveriesStack.Screen name="Bids" component={BidsScreen} />
      <ClientDeliveriesStack.Screen name="TrackDelivery" component={TrackDeliveryScreen} />
      <ClientDeliveriesStack.Screen name="Payment" component={PaymentScreen} />
      <ClientDeliveriesStack.Screen name="RateDelivery" component={RateDeliveryScreen} />
    </ClientDeliveriesStack.Navigator>
  )
}

// Navigateur pour les livraisons des coursiers
const CourierDeliveriesNavigator: React.FC = () => {
  return (
    <CourierDeliveriesStack.Navigator screenOptions={{ headerShown: false }}>
      <CourierDeliveriesStack.Screen name="DeliveriesList" component={CourierDeliveriesScreen} />
      <CourierDeliveriesStack.Screen name="DeliveryDetails" component={CourierDeliveryDetailsScreen} />
      <CourierDeliveriesStack.Screen name="Bid" component={BidScreen} />
      <CourierDeliveriesStack.Screen name="TrackDelivery" component={CourierTrackDeliveryScreen} />
      <CourierDeliveriesStack.Screen name="CollaborativeDeliveries" component={CollaborativeDeliveriesScreen} />
    </CourierDeliveriesStack.Navigator>
  )
}

// Composants fictifs pour les écrans non encore implémentés
const ClientDeliveriesScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des livraisons client</Text>
  </View>
)

const DeliveryDetailsScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des détails de livraison</Text>
  </View>
)

const CourierDeliveriesScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des livraisons coursier</Text>
  </View>
)

const CourierDeliveryDetailsScreen: React.FC = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des détails de livraison coursier</Text>
  </View>
)

// Composant principal de l'application
const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean>(false)
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    // Vérifier s'il s'agit du premier lancement de l'application
    const checkFirstLaunch = async (): Promise<void> => {
      try {
        const value = await AsyncStorage.getItem("alreadyLaunched")

        if (value === null) {
          await AsyncStorage.setItem("alreadyLaunched", "true")
          setIsFirstLaunch(true)
        } else {
          setIsFirstLaunch(false)
        }
      } catch (error) {
        console.error("Error checking first launch:", error)
        setIsFirstLaunch(false)
      }
    }

    // Charger le type d'utilisateur (client ou coursier)
    const loadUserType = async (): Promise<void> => {
      try {
        const type = await AsyncStorage.getItem("userType")
        setUserType(type || "client") // Par défaut, l'utilisateur est un client
      } catch (error) {
        console.error("Error loading user type:", error)
        setUserType("client")
      }
    }

    const initialize = async (): Promise<void> => {
      await Promise.all([checkFirstLaunch(), loadUserType()])
      setIsLoading(false)
      await SplashScreen.hideAsync()
    }

    initialize()
  }, [])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider>
            <NetworkProvider>
              <AuthProvider>
                <WebSocketProvider>
                  <NotificationProvider>
                    <NavigationContainer>
                      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

                      <Stack.Navigator screenOptions={{ headerShown: false }}>
                        {isFirstLaunch && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}

                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

                        <Stack.Screen name="ClientMain" component={ClientTabNavigator} />
                        <Stack.Screen name="CourierMain" component={CourierTabNavigator} />

                        <Stack.Screen name="Notifications" component={NotificationsScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="MerchantDetails" component={MerchantDetailsScreen} />

                        {/* Écrans supplémentaires pour les coursiers */}
                        <Stack.Screen name="CourierStatus" component={CourierStatusScreen} />
                        <Stack.Screen name="CourierStats" component={CourierStatsScreen} />
                      </Stack.Navigator>

                      <VoiceAssistant />
                    </NavigationContainer>
                  </NotificationProvider>
                </WebSocketProvider>
              </AuthProvider>
            </NetworkProvider>
          </ThemeProvider>
        </I18nextProvider>
      </PaperProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
})

export default App
