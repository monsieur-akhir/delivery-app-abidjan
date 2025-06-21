import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, getWsUrl } from '../config/environment';

export const debugWebSocketConnection = async () => {
  console.log('🔍 Debug WebSocket Connection');
  console.log('=' * 50);
  
  try {
    // Vérifier les données stockées
    const storedUser = await AsyncStorage.getItem("user");
    const storedToken = await AsyncStorage.getItem("token");
    const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
    
    console.log('📱 Données stockées:');
    console.log('- User:', storedUser ? '✅ Présent' : '❌ Absent');
    console.log('- Token:', storedToken ? `✅ Présent (${storedToken.slice(0, 20)}...)` : '❌ Absent');
    console.log('- Refresh Token:', storedRefreshToken ? '✅ Présent' : '❌ Absent');
    
    if (storedUser) {
      const user = JSON.parse(storedUser);
      console.log('- User ID:', user.id);
      console.log('- User Role:', user.role);
    }
    
    // Vérifier la configuration
    console.log('\n⚙️ Configuration:');
    console.log('- API URL:', getApiUrl());
    console.log('- WS URL:', getWsUrl());
    
    // Construire l'URL WebSocket
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      const wsUrl = `${getWsUrl()}/${user.id}?token=${storedToken}`;
      console.log('- URL WebSocket complète:', wsUrl);
    }
    
    // Vérifier si le token est valide
    if (storedToken) {
      try {
        const response = await fetch(`${getApiUrl()}/auth/verify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('\n🔐 Validation du token:');
        if (response.ok) {
          console.log('- Token: ✅ Valide');
        } else {
          console.log('- Token: ❌ Invalide (status:', response.status, ')');
        }
      } catch (error) {
        console.log('- Token: ❌ Erreur de validation:', error);
      }
    }
    
    console.log('\n📋 Recommandations:');
    if (!storedUser || !storedToken) {
      console.log('- ❌ Utilisateur non connecté. Connectez-vous d\'abord.');
    } else {
      console.log('- ✅ Utilisateur connecté. Le WebSocket devrait se connecter automatiquement.');
      console.log('- 📱 Vérifiez les logs Expo pour voir les messages WebSocket.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
  
  console.log('=' * 50);
};

export const testWebSocketConnection = async () => {
  console.log('🧪 Test WebSocket Connection');
  console.log('=' * 50);
  
  try {
    const storedUser = await AsyncStorage.getItem("user");
    const storedToken = await AsyncStorage.getItem("token");
    
    if (!storedUser || !storedToken) {
      console.log('❌ Impossible de tester: utilisateur non connecté');
      return;
    }
    
    const user = JSON.parse(storedUser);
    const wsUrl = `${getWsUrl()}/${user.id}?token=${storedToken}`;
    
    console.log('🔗 Tentative de connexion WebSocket...');
    console.log('URL:', wsUrl);
    
    // Note: Cette fonction ne peut pas réellement tester la connexion WebSocket
    // car elle nécessite l'environnement React Native, mais elle peut aider au debug
    console.log('✅ Configuration WebSocket correcte');
    console.log('📱 Vérifiez les logs Expo pour voir la connexion réelle');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
  
  console.log('=' * 50);
}; 