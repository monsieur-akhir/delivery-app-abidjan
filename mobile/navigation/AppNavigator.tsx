"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { NavigationContainer } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
import { useAuth } from "../contexts/AuthContext"

// Auth Screens
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import VerifyOTPScreen from "../screens/auth/VerifyOTPScreen"
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen"

// Client Screens
import ClientHomeScreen from "../screens/client/HomeScreen"
import CreateDeliveryScreen from "../screens/client/CreateDeliveryScreen"
import BidsScreen from "../screens/client/BidsScreen"
import TrackDeliveryScreen from "../screens/client/TrackDeliveryScreen"
import PaymentScreen from "../screens/client/PaymentScreen"
import MarketplaceScreen from "../screens/client/MarketplaceScreen"
import MerchantDetailsScreen from "../screens/client/MerchantDetailsScreen"
import RateDeliveryScreen from "../screens/client/RateDeliveryScreen"
import EnhancedRateDeliveryScreen from "../screens/client/EnhancedRateDeliveryScreen"
import DeliveryDetailsScreen from "../screens/client/DeliveryDetailsScreen"
import DeliveryHistoryScreen from "../screens/client/DeliveryHistoryScreen"

// Courier Screens
import CourierHomeScreen from "../screens/courier/HomeScreen"
import BidScreen from "../screens/courier/BidScreen"
import CourierTrackDeliveryScreen from "../screens/courier/CourierTrackDeliveryScreen"
import CourierEarningsScreen from "../screens/courier/CourierEarningsScreen"
import CourierStatusScreen from "../screens/courier/CourierStatusScreen"
import CourierStatsScreen from "../screens/courier/CourierStatsScreen"
import CourierDeliveryHistoryScreen from "../screens/courier/DeliveryHistoryScreen"
import CollaborativeDeliveriesScreen from "../screens/courier/CollaborativeDeliveriesScreen"
import CollaborativeChatScreen from "../screens/courier/CollaborativeChatScreen"
import GamificationScreen from "../screens/courier/GamificationScreen"
import CommunityWalletScreen from "../screens/courier/CommunityWalletScreen"
import VehicleManagementScreen from "../screens/courier/VehicleManagementScreen"

// Common Screens
import ProfileScreen from "../screens/profile/ProfileScreen"
import NotificationsScreen from "../screens/NotificationsScreen"
import SettingsScreen from "../screens/SettingsScreen"
import SupportScreen from "../screens/SupportScreen"
import MultiLanguageSettingsScreen from "../screens/MultiLanguageSettingsScreen"

// Types
import type { RootStackParamList } from "../types/navigation"

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator()

const ClientTabs = () => {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="ClientHome"
        component={ClientHomeScreen}
        options={{
          tabBarLabel: t("navigation.home"),
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarLabel: t("navigation.marketplace"),
          tabBarIcon: ({ color, size }) => <Feather name="shopping-bag" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ClientNotifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: t("navigation.notifications"),
          tabBarIcon: ({ color, size }) => <Feather name="bell" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="ClientProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("navigation.profile"),
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

const CourierTabs = () => {
  const { t } = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#EEEEEE",
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="CourierHome"
        component={CourierHomeScreen}
        options={{
          tabBarLabel: t("navigation.home"),
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CourierEarnings"
        component={CourierEarningsScreen}
        options={{
          tabBarLabel: t("navigation.earnings"),
          tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CourierNotifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: t("navigation.notifications"),
          tabBarIcon: ({ color, size }) => <Feather name="bell" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CourierProfile"
        component={ProfileScreen}
        options={{
          tabBarLabel: t("navigation.profile"),
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

const AppNavigator = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!user ? (
          // Auth Screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : user.role === "client" ? (
          // Client Screens
          <>
            <Stack.Screen name="ClientTabs" component={ClientTabs} />
            <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
            <Stack.Screen name="Bids" component={BidsScreen} />
            <Stack.Screen name="TrackDelivery" component={TrackDeliveryScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="MerchantDetails" component={MerchantDetailsScreen} />
            <Stack.Screen name="RateDelivery" component={RateDeliveryScreen} />
            <Stack.Screen name="EnhancedRateDelivery" component={EnhancedRateDeliveryScreen} />
            <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
            <Stack.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="LanguageSettings" component={MultiLanguageSettingsScreen} />
          </>
        ) : (
          // Courier Screens
          <>
            <Stack.Screen name="CourierTabs" component={CourierTabs} />
            <Stack.Screen name="Bid" component={BidScreen} />
            <Stack.Screen name="CourierTrackDelivery" component={CourierTrackDeliveryScreen} />
            <Stack.Screen name="CourierStatus" component={CourierStatusScreen} />
            <Stack.Screen name="CourierStats" component={CourierStatsScreen} />
            <Stack.Screen name="CourierDeliveryHistory" component={CourierDeliveryHistoryScreen} />
            <Stack.Screen name="CollaborativeDeliveries" component={CollaborativeDeliveriesScreen} />
            <Stack.Screen name="CollaborativeChat" component={CollaborativeChatScreen} />
            <Stack.Screen name="Gamification" component={GamificationScreen} />
            <Stack.Screen name="CommunityWallet" component={CommunityWalletScreen} />
            <Stack.Screen
              name="VehicleManagement"
              component={VehicleManagementScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="LanguageSettings" component={MultiLanguageSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator
