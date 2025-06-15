
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WebSocketProvider } from './contexts/WebSocketContext';

// Screens
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ForgotPasswordScreen from './screens/auth/ForgotPasswordScreen';
import VerifyOTPScreen from './screens/auth/VerifyOTPScreen';

// Client Screens
import ClientHomeScreen from './screens/client/HomeScreen';
import CreateDeliveryScreen from './screens/client/CreateDeliveryScreen';
import TrackDeliveryScreen from './screens/client/TrackDeliveryScreen';

// Courier Screens
import CourierHomeScreen from './screens/courier/HomeScreen';
import BidScreen from './screens/courier/BidScreen';
import CourierTrackDeliveryScreen from './screens/courier/CourierTrackDeliveryScreen';

// Common Screens
import ProfileScreen from './screens/profile/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import NotificationsScreen from './screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts - using system fonts for now
        await Font.loadAsync({
          // Using system fonts to avoid file path issues
        });
      } catch (e) {
        console.warn('Error loading fonts:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AuthProvider>
            <NotificationProvider>
              <WebSocketProvider>
                <PaperProvider>
                  <NavigationContainer>
                    <Stack.Navigator
                      initialRouteName="Login"
                      screenOptions={{
                        headerStyle: {
                          backgroundColor: '#FF6B00',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      {/* Auth Screens */}
                      <Stack.Screen 
                        name="Login" 
                        component={LoginScreen}
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen 
                        name="Register" 
                        component={RegisterScreen}
                        options={{ title: 'Inscription' }}
                      />
                      <Stack.Screen 
                        name="ForgotPassword" 
                        component={ForgotPasswordScreen}
                        options={{ title: 'Mot de passe oublié' }}
                      />
                      <Stack.Screen 
                        name="VerifyOTP" 
                        component={VerifyOTPScreen}
                        options={{ title: 'Vérification' }}
                      />

                      {/* Client Screens */}
                      <Stack.Screen 
                        name="ClientHome" 
                        component={ClientHomeScreen}
                        options={{ title: 'Accueil' }}
                      />
                      <Stack.Screen 
                        name="CreateDelivery" 
                        component={CreateDeliveryScreen}
                        options={{ title: 'Nouvelle livraison' }}
                      />
                      <Stack.Screen 
                        name="TrackDelivery" 
                        component={TrackDeliveryScreen}
                        options={{ title: 'Suivi' }}
                      />

                      {/* Courier Screens */}
                      <Stack.Screen 
                        name="CourierHome" 
                        component={CourierHomeScreen}
                        options={{ title: 'Tableau de bord' }}
                      />
                      <Stack.Screen 
                        name="BidScreen" 
                        component={BidScreen}
                        options={{ title: 'Faire une offre' }}
                      />
                      <Stack.Screen 
                        name="CourierTrackDelivery" 
                        component={CourierTrackDeliveryScreen}
                        options={{ title: 'Livraison en cours' }}
                      />

                      {/* Common Screens */}
                      <Stack.Screen 
                        name="Profile" 
                        component={ProfileScreen}
                        options={{ title: 'Profil' }}
                      />
                      <Stack.Screen 
                        name="Settings" 
                        component={SettingsScreen}
                        options={{ title: 'Paramètres' }}
                      />
                      <Stack.Screen 
                        name="Notifications" 
                        component={NotificationsScreen}
                        options={{ title: 'Notifications' }}
                      />
                    </Stack.Navigator>
                  </NavigationContainer>
                  <StatusBar style="light" />
                </PaperProvider>
              </WebSocketProvider>
            </NotificationProvider>
          </AuthProvider>
        </NetworkProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
