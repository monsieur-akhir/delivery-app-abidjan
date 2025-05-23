"use client"

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

// Écrans communs
import ProfileScreen from "./screens/profile/ProfileScreen"
import NotificationsScreen from "./screens/NotificationsScreen"
import SettingsScreen from "./screens/SettingsScreen"
import OnboardingScreen from "./screens/OnboardingScreen"

// Composants
import VoiceAssistant from "./components/VoiceAssistant"

// Ignorer certains avertissements
LogBox.ignoreLogs(["ViewPropTypes will be removed", "ColorPropType will be removed"])

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

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
const ClientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = "home"
          } else if (route.name === "Deliveries") {
            iconName = "package"
          } else if (route.name === "Marketplace") {
            iconName = "shopping"
          } else if (route.name === "Profile") {
            iconName = "account"
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
const CourierTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = "home"
          } else if (route.name === "Deliveries") {
            iconName = "package"
          } else if (route.name === "Earnings") {
            iconName = "cash"
          } else if (route.name === "Profile") {
            iconName = "account"
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
const ClientDeliveriesNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DeliveriesList" component={ClientDeliveriesScreen} />
      <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
      <Stack.Screen name="Bids" component={BidsScreen} />
      <Stack.Screen name="TrackDelivery" component={TrackDeliveryScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="RateDelivery" component={RateDeliveryScreen} />
    </Stack.Navigator>
  )
}

// Navigateur pour les livraisons des coursiers
const CourierDeliveriesNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DeliveriesList" component={CourierDeliveriesScreen} />
      <Stack.Screen name="Bid" component={BidScreen} />
      <Stack.Screen name="TrackDelivery" component={CourierTrackDeliveryScreen} />
    </Stack.Navigator>
  )
}

// Composants fictifs pour les écrans non encore implémentés
const ClientDeliveriesScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des livraisons client</Text>
  </View>
)

const CourierDeliveriesScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des livraisons coursier</Text>
  </View>
)

const CourierEarningsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran des gains coursier</Text>
  </View>
)

const CourierTrackDeliveryScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Écran de suivi coursier</Text>
  </View>
)

// Composant principal de l'application
const App = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [isFirstLaunch, setIsFirstLaunch] = useState(false)
  const [userType, setUserType] = useState(null)

  useEffect(() => {
    // Vérifier s'il s'agit du premier lancement de l'application
    checkFirstLaunch()

    // Charger le type d'utilisateur (client ou coursier)
    loadUserType()
  }, [])

  const checkFirstLaunch = async () => {
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

  const loadUserType = async () => {
    try {
      const type = await AsyncStorage.getItem("userType")
      setUserType(type || "client") // Par défaut, l'utilisateur est un client
    } catch (error) {
      console.error("Error loading user type:", error)
      setUserType("client")
    } finally {
      setIsLoading(false)
    }
  }

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
