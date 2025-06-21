// Test simple pour vérifier l'autocomplétion d'adresse
// Ce fichier peut être exécuté avec Node.js pour tester l'API

const testAutocomplete = async () => {
  try {
    // URL de test (remplacez par votre URL backend)
    const API_URL = 'http://localhost:8000'; // ou votre URL de production
    
    console.log('🧪 Test de l\'autocomplétion d\'adresse...');
    
    // Test 1: Recherche simple
    const response = await fetch(`${API_URL}/api/deliveries/address-autocomplete?input=cocody`, {
      headers: {
        'Content-Type': 'application/json',
        // Note: Si l'endpoint est sécurisé, ajoutez votre token ici
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Réponse reçue:', JSON.stringify(data, null, 2));
    
    if (data.predictions && data.predictions.length > 0) {
      console.log('✅ Autocomplétion fonctionne !');
      console.log(`📍 ${data.predictions.length} suggestions trouvées`);
      data.predictions.slice(0, 3).forEach((pred, index) => {
        console.log(`  ${index + 1}. ${pred.description}`);
      });
    } else {
      console.log('⚠️  Aucune suggestion trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 L\'endpoint semble être sécurisé. Ajoutez un token d\'authentification.');
    } else if (error.message.includes('404')) {
      console.log('💡 Vérifiez que l\'URL de l\'endpoint est correcte.');
    }
  }
};

// Exécuter le test
testAutocomplete(); 