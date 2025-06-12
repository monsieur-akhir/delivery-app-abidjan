import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Feather } from "@expo/vector-icons"
import type { RootStackParamList, ClientTabParamList, CourierTabParamList } from "../types/navigation"

// Auth screens
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import VerifyOTPScreen from "../screens/auth/VerifyOTPScreen"
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen"

// Client screens
import ClientHomeScreen from "../screens/client/HomeScreen"
import CreateDeliveryScreen from "../screens/client/CreateDeliveryScreen"
import MarketplaceScreen from "../screens/client/MarketplaceScreen"
import MerchantDetailsScreen from "../screens/client/MerchantDetailsScreen"
import DeliveryHistoryScreen from "../screens/client/DeliveryHistoryScreen"
import DeliveryDetailsScreen from "../screens/client/DeliveryDetailsScreen"
import BidsScreen from "../screens/client/BidsScreen"
import TrackDeliveryScreen from "../screens/client/TrackDeliveryScreen"
import PaymentScreen from "../screens/client/PaymentScreen"
import RateDeliveryScreen from "../screens/client/RateDeliveryScreen"
import EnhancedRateDeliveryScreen from "../screens/client/EnhancedRateDeliveryScreen"
import NotificationsScreen from "../screens/NotificationsScreen"
import SettingsScreen from "../screens/SettingsScreen"

// Courier screens
import CourierHomeScreen from "../screens/courier/HomeScreen"
import BidScreen from "../screens/courier/BidScreen"
import CourierTrackDeliveryScreen from "../screens/courier/CourierTrackDeliveryScreen"
import CourierEarningsScreen from "../screens/courier/CourierEarningsScreen"
import CourierStatusScreen from "../screens/courier/CourierStatusScreen"
import CourierStatsScreen from "../screens/courier/CourierStatsScreen"
import CollaborativeDeliveriesScreen from "../screens/courier/CollaborativeDeliveriesScreen"
import CollaborativeChatScreen from "../screens/courier/CollaborativeChatScreen"
import GamificationScreen from "../screens/courier/GamificationScreen"
import CommunityWalletScreen from "../screens/courier/CommunityWalletScreen"
import VehicleManagementScreen from "../screens/courier/VehicleManagementScreen"
import CourierProfileScreen from "../screens/courier/CourierProfileScreen"
// New Courier Screens
import AvailableDeliveriesScreen from "../screens/courier/AvailableDeliveriesScreen"
// import DeliveryDetailsScreen from "../screens/courier/DeliveryDetailsScreen" // Assuming this is a shared component or already imported


// Other screens
import SupportScreen from "../screens/SupportScreen"
import LanguageSettingsScreen from "../screens/MultiLanguageSettingsScreen"
import CourierDeliveryHistoryScreen from "@/screens/courier/CourierDeliveryHistoryScreen"

const Stack = createNativeStackNavigator<RootStackParamList>()
const ClientTab = createBottomTabNavigator<ClientTabParamList>()
const CourierTab = createBottomTabNavigator<CourierTabParamList>()

// Type for Feather icons
type FeatherIconName = React.ComponentProps<typeof Feather>["name"]

// Tab navigator for client
const ClientTabNavigator = () => {
  return (
    <ClientTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: FeatherIconName = "home"

          if (route.name === "ClientHome") {
            iconName = "home"
          } else if (route.name === "Marketplace") {
            iconName = "shopping-cart"
          } else if (route.name === "DeliveryHistory") {
            iconName = "clock"
          } else if (route.name === "Settings") {
            iconName = "settings"
          }

          return <Feather name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
      })}
    >
      <ClientTab.Screen name="ClientHome" component={ClientHomeScreen} options={{ title: "Accueil" }} />
      <ClientTab.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: "Marchands" }} />
      <ClientTab.Screen name="DeliveryHistory" component={DeliveryHistoryScreen} options={{ title: "Historique" }} />
      <ClientTab.Screen name="Settings" component={SettingsScreen} options={{ title: "Paramètres" }} />
    </ClientTab.Navigator>
  )
}

// Tab navigator for courier
const CourierTabNavigator = () => {
  return (
    <CourierTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: FeatherIconName = "home"

          if (route.name === "CourierHome") {
            iconName = "home"
          } else if (route.name === "CourierEarnings") {
            iconName = "dollar-sign"
          } else if (route.name === "CourierDeliveryHistory") {
            iconName = "clock"
          } else if (route.name === "Settings") {
            iconName = "settings"
          }

          return <Feather name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        headerShown: false,
      })}
    >
      <CourierTab.Screen name="CourierHome" component={CourierHomeScreen} options={{ title: "Accueil" }} />
      <CourierTab.Screen name="CourierEarnings" component={CourierEarningsScreen} options={{ title: "Gains" }} />
      <CourierTab.Screen
        name="CourierDeliveryHistory"
        component={CourierDeliveryHistoryScreen}
        options={{ title: "Historique" }}
      />
      <CourierTab.Screen name="Settings" component={SettingsScreen} options={{ title: "Paramètres" }} />
    </CourierTab.Navigator>
  )
}

// Main navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Tab navigators */}
        <Stack.Screen name="ClientTabs" component={ClientTabNavigator} />
        <Stack.Screen name="CourierTabs" component={CourierTabNavigator} />

        {/* Client screens */}
        <Stack.Screen name="Home" component={ClientHomeScreen} />
        <Stack.Screen name="CreateDelivery" component={CreateDeliveryScreen} />
        <Stack.Screen name="MerchantDetails" component={MerchantDetailsScreen} />
        <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
        <Stack.Screen name="Bids" component={BidsScreen} />
        <Stack.Screen name="TrackDelivery" component={TrackDeliveryScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="RateDelivery" component={RateDeliveryScreen} />
        <Stack.Screen name="EnhancedRateDelivery" component={EnhancedRateDeliveryScreen} />

        {/* Courier screens */}
        <Stack.Screen name="Bid" component={BidScreen} />
        <Stack.Screen name="CourierTrackDelivery" component={CourierTrackDeliveryScreen} />
        <Stack.Screen name="CourierStatus" component={CourierStatusScreen} />
        <Stack.Screen name="CourierStats" component={CourierStatsScreen} />
        <Stack.Screen name="CollaborativeDeliveries" component={CollaborativeDeliveriesScreen} />
        <Stack.Screen name="CollaborativeChat" component={CollaborativeChatScreen} />
        <Stack.Screen name="Gamification" component={GamificationScreen} />
        <Stack.Screen name="CommunityWallet" component={CommunityWalletScreen} />
        <Stack.Screen name="VehicleManagement" component={VehicleManagementScreen} />
        <Stack.Screen name="CourierProfile" component={CourierProfileScreen} />
        <Stack.Screen name="AvailableDeliveries" component={AvailableDeliveriesScreen} />
        <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />

        {/* Common screens */}
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
        <Stack.Screen name="Main" component={ClientTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default AppNavigator