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
import { LoaderProvider, useLoader } from './src/contexts/LoaderContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './src/i18n';
import { useTokenSync } from './src/hooks/useTokenSync';
import CustomAlert from './src/components/CustomAlert';
import CustomLoaderModal from './src/components/CustomLoaderModal';
import { useAlert } from './src/hooks/useAlert';

// Composant pour gérer la synchronisation des tokens
const TokenSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useTokenSync();
  return <>{children}</>;
};

// Composant pour gérer les alertes et loaders globaux
const GlobalUIWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    alertVisible, 
    alertConfig, 
    hideAlert,
    toastVisible,
    toastConfig,
    hideToast
  } = useAlert();

  const { loading, message, hideLoader } = useLoader();

  return (
    <>
      {children}
      
      {/* Alertes globales */}
      <CustomAlert
        visible={alertVisible}
        {...alertConfig}
        onDismiss={hideAlert}
      />
      
      {/* Loader global */}
      <CustomLoaderModal
        visible={loading}
        message={message}
        timeoutMs={30000}
        onDismiss={hideLoader}
      />
    </>
  );
};

function AuthGate() {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  return <AppNavigator />;
}

export default function App() {
  // Gestion d'erreur globale
  const handleError = (error: any) => {
    console.warn('Erreur globale de l\'application:', error);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NetworkProvider>
            <AuthProvider>
              <TokenSyncWrapper>
                <NotificationProvider>
                  <WebSocketProvider>
                    <LoaderProvider>
                      <GlobalUIWrapper>
                        <NavigationContainer
                          onStateChange={(state) => {
                            console.log('Navigation state:', state);
                          }}
                        >
                          <AuthGate />
                          <StatusBar style="auto" />
                        </NavigationContainer>
                      </GlobalUIWrapper>
                    </LoaderProvider>
                  </WebSocketProvider>
                </NotificationProvider>
              </TokenSyncWrapper>
            </AuthProvider>
          </NetworkProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}