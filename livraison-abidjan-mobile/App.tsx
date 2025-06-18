import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <NotificationProvider>
                <WebSocketProvider>
                  <NavigationContainer>
                    <AppNavigator />
                    <StatusBar style="auto" />
                  </NavigationContainer>
                </WebSocketProvider>
              </NotificationProvider>
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}