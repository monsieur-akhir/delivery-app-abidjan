import 'react-native-get-random-values';
import './src/utils/polyfills';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { WebSocketProvider } from './src/contexts/WebSocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n';
import { useTokenSync } from './src/hooks/useTokenSync';

// Composant pour gérer la synchronisation des tokens
const TokenSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useTokenSync();
  return <>{children}</>;
};

function AuthGate() {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  return <AppNavigator />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <TokenSyncWrapper>
                <WebSocketProvider>
                  <NotificationProvider>
                    <NavigationContainer>
                      <AuthGate />
                      <StatusBar style="auto" />
                    </NavigationContainer>
                  </NotificationProvider>
                </WebSocketProvider>
              </TokenSyncWrapper>
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}