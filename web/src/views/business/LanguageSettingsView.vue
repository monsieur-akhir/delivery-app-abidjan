<template>
  <div class="language-settings-container">
    <div class="page-header">
      <h1>Paramètres linguistiques</h1>
      <button class="btn btn-primary" @click="saveSettings" :disabled="isSaving">
        <span v-if="isSaving">
          <i class="fas fa-spinner fa-spin"></i> Enregistrement...
        </span>
        <span v-else>
          <i class="fas fa-save"></i> Enregistrer
        </span>
      </button>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des paramètres linguistiques...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchLanguageSettings">Réessayer</button>
    </div>

    <div v-else class="settings-content">
      <!-- Langue principale -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Langue principale</h2>
          <p class="help-text">Sélectionnez la langue principale pour votre entreprise.</p>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label for="primary-language">Langue principale</label>
            <select id="primary-language" v-model="languageSettings.primary_language">
              <option v-for="language in availableLanguages" :key="language.code" :value="language.code">
                {{ language.name }}
              </option>
            </select>
          </div>
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="auto-translate" 
              v-model="languageSettings.auto_translate"
            >
            <label for="auto-translate">Traduire automatiquement les messages dans la langue du client</label>
          </div>
        </div>
      </div>

      <!-- Langues supplémentaires -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Langues supplémentaires</h2>
          <p class="help-text">Sélectionnez les langues supplémentaires que vous souhaitez prendre en charge.</p>
        </div>
        <div class="card-body">
          <div class="languages-grid">
            <div 
              v-for="language in availableLanguages" 
              :key="language.code"
              class="language-item"
              :class="{ 'active': isLanguageActive(language.code) }"
              @click="toggleLanguage(language.code)"
            >
              <div class="language-flag">
                <img :src="language.flag" :alt="language.name">
              </div>
              <div class="language-info">
                <h3>{{ language.name }}</h3>
                <p>{{ language.native }}</p>
              </div>
              <div class="language-toggle">
                <div class="toggle-switch">
                  <input 
                    type="checkbox" 
                    :id="`lang-${language.code}`" 
                    :checked="isLanguageActive(language.code)"
                    @change="toggleLanguage(language.code)"
                  >
                  <label :for="`lang-${language.code}`"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Traductions personnalisées -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Traductions personnalisées</h2>
          <p class="help-text">Personnalisez les traductions pour les termes spécifiques à votre entreprise.</p>
        </div>
        <div class="card-body">
          <div class="custom-translations">
            <div class="translations-header">
              <div class="translation-key">Terme</div>
              <div 
                v-for="language in activeLanguages" 
                :key="language.code" 
                class="translation-value"
              >
                {{ language.name }}
              </div>
              <div class="translation-actions"></div>
            </div>
            
            <div 
              v-for="(translation, index) in customTranslations" 
              :key="index" 
              class="translation-row"
            >
              <div class="translation-key">
                <input 
                  type="text" 
                  v-model="translation.key" 
                  placeholder="Terme"
                >
              </div>
              <div 
                v-for="language in activeLanguages" 
                :key="`${index}-${language.code}`" 
                class="translation-value"
              >
                <input 
                  type="text" 
                  v-model="translation.values[language.code]" 
                  :placeholder="`Traduction en ${language.name}`"
                >
              </div>
              <div class="translation-actions">
                <button 
                  type="button" 
                  class="btn-icon btn-danger" 
                  @click="removeTranslation(index)"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="add-translation">
              <button type="button" class="btn btn-outline" @click="addTranslation">
                <i class="fas fa-plus"></i> Ajouter une traduction
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Paramètres de communication -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Paramètres de communication</h2>
          <p class="help-text">Configurez les paramètres de communication multilingue.</p>
        </div>
        <div class="card-body">
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="multilingual-notifications" 
              v-model="languageSettings.multilingual_notifications"
            >
            <label for="multilingual-notifications">Envoyer les notifications dans la langue préférée du client</label>
          </div>
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="multilingual-invoices" 
              v-model="languageSettings.multilingual_invoices"
            >
            <label for="multilingual-invoices">Générer les factures dans la langue préférée du client</label>
          </div>
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="multilingual-sms" 
              v-model="languageSettings.multilingual_sms"
            >
            <label for="multilingual-sms">Envoyer les SMS dans la langue préférée du client</label>
          </div>
          <div class="form-group">
            <label for="fallback-language">Langue de secours</label>
            <select id="fallback-language" v-model="languageSettings.fallback_language">
              <option v-for="language in availableLanguages" :key="language.code" :value="language.code">
                {{ language.name }}
              </option>
            </select>
            <p class="input-help">Langue utilisée lorsque la traduction n'est pas disponible dans la langue préférée du client.</p>
          </div>
        </div>
      </div>

      <!-- Paramètres vocaux -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Paramètres vocaux</h2>
          <p class="help-text">Configurez les paramètres pour l'assistant vocal multilingue.</p>
        </div>
        <div class="card-body">
          <div class="form-group checkbox-group">
            <input 
              type="checkbox" 
              id="voice-assistant" 
              v-model="languageSettings.voice_assistant_enabled"
            >
            <label for="voice-assistant">Activer l'assistant vocal multilingue</label>
          </div>
          <div class="form-group">
            <label for="voice-languages">Langues prises en charge par l'assistant vocal</label>
            <select 
              id="voice-languages" 
              v-model="languageSettings.voice_languages" 
              multiple
              :disabled="!languageSettings.voice_assistant_enabled"
            >
              <option v-for="language in availableLanguages" :key="language.code" :value="language.code">
                {{ language.name }}
              </option>
            </select>
            <p class="input-help">Maintenez la touche Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs langues.</p>
          </div>
          <div class="form-group">
            <label for="voice-default">Langue par défaut de l'assistant vocal</label>
            <select 
              id="voice-default" 
              v-model="languageSettings.voice_default_language"
              :disabled="!languageSettings.voice_assistant_enabled"
            >
              <option v-for="language in voiceLanguages" :key="language.code" :value="language.code">
                {{ language.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { getLanguageSettings, updateLanguageSettings } from '@/api/settings';

export default {
  name: 'LanguageSettingsView',
  setup() {
    const { showToast } = useToast();
    
    // État
    const loading = ref(true);
    const error = ref(null);
    const isSaving = ref(false);
    
    // Langues disponibles
    const availableLanguages = [
      {
        code: 'fr',
        name: 'Français',
        native: 'Français',
        flag: '/images/flags/fr.png'
      },
      {
        code: 'en',
        name: 'Anglais',
        native: 'English',
        flag: '/images/flags/en.png'
      },
      {
        code: 'dioula',
        name: 'Dioula',
        native: 'Jula',
        flag: '/images/flags/ci.png'
      },
      {
        code: 'baoule',
        name: 'Baoulé',
        native: 'Baoulé',
        flag: '/images/flags/ci.png'
      },
      {
        code: 'ar',
        name: 'Arabe',
        native: 'العربية',
        flag: '/images/flags/ar.png'
      }
    ];
    
    // Paramètres linguistiques
    const languageSettings = reactive({
      primary_language: 'fr',
      active_languages: ['fr'],
      auto_translate: true,
      multilingual_notifications: true,
      multilingual_invoices: false,
      multilingual_sms: true,
      fallback_language: 'fr',
      voice_assistant_enabled: true,
      voice_languages: ['fr', 'dioula'],
      voice_default_language: 'fr'
    });
    
    // Traductions personnalisées
    const customTranslations = ref([
      {
        key: 'delivery_status_pending',
        values: {
          fr: 'En attente',
          en: 'Pending',
          dioula: 'A bɛ makɔnɔ',
          baoule: 'Ɔ ti mɔ'
        }
      },
      {
        key: 'delivery_status_in_progress',
        values: {
          fr: 'En cours',
          en: 'In progress',
          dioula: 'A bɛ taama',
          baoule: 'Ɔ wo yɔ'
        }
      }
    ]);
    
    // Computed
    const activeLanguages = computed(() => {
      return availableLanguages.filter(lang => languageSettings.active_languages.includes(lang.code));
    });
    
    const voiceLanguages = computed(() => {
      return availableLanguages.filter(lang => languageSettings.voice_languages.includes(lang.code));
    });
    
    // Méthodes
    const fetchLanguageSettings = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await getLanguageSettings();
        
        // Mettre à jour les paramètres avec les données reçues
        if (response.data.primary_language) {
          languageSettings.primary_language = response.data.primary_language;
        }
        
        if (response.data.active_languages) {
          languageSettings.active_languages = response.data.active_languages;
        }
        
        if (response.data.auto_translate !== undefined) {
          languageSettings.auto_translate = response.data.auto_translate;
        }
        
        if (response.data.multilingual_notifications !== undefined) {
          languageSettings.multilingual_notifications = response.data.multilingual_notifications;
        }
        
        if (response.data.multilingual_invoices !== undefined) {
          languageSettings.multilingual_invoices = response.data.multilingual_invoices;
        }
        
        if (response.data.multilingual_sms !== undefined) {
          languageSettings.multilingual_sms = response.data.multilingual_sms;
        }
        
        if (response.data.fallback_language) {
          languageSettings.fallback_language = response.data.fallback_language;
        }
        
        if (response.data.voice_assistant_enabled !== undefined) {
          languageSettings.voice_assistant_enabled = response.data.voice_assistant_enabled;
        }
        
        if (response.data.voice_languages) {
          languageSettings.voice_languages = response.data.voice_languages;
        }
        
        if (response.data.voice_default_language) {
          languageSettings.voice_default_language = response.data.voice_default_language;
        }
        
        if (response.data.custom_translations) {
          customTranslations.value = response.data.custom_translations;
        }
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres linguistiques:', err);
        error.value = 'Impossible de charger les paramètres linguistiques. Veuillez réessayer.';
      } finally {
        loading.value = false;
      }
    };
    
    const saveSettings = async () => {
      isSaving.value = true;
      
      try {
        await updateLanguageSettings({
          ...languageSettings,
          custom_translations: customTranslations.value
        });
        
        showToast('Succès', 'Les paramètres linguistiques ont été enregistrés avec succès', 'success');
      } catch (err) {
        console.error('Erreur lors de l\'enregistrement des paramètres linguistiques:', err);
        showToast('Erreur', 'Impossible d\'enregistrer les paramètres linguistiques. Veuillez réessayer.', 'error');
      } finally {
        isSaving.value = false;
      }
    };
    
    const isLanguageActive = (code) => {
      return languageSettings.active_languages.includes(code);
    };
    
    const toggleLanguage = (code) => {
      // Ne pas permettre de désactiver la langue principale
      if (code === languageSettings.primary_language) {
        return;
      }
      
      if (isLanguageActive(code)) {
        // Retirer la langue
        languageSettings.active_languages = languageSettings.active_languages.filter(lang => lang !== code);
        
        // Retirer également de la liste des langues vocales si nécessaire
        if (languageSettings.voice_languages.includes(code)) {
          languageSettings.voice_languages = languageSettings.voice_languages.filter(lang => lang !== code);
        }
        
        // Mettre à jour la langue par défaut de l'assistant vocal si nécessaire
        if (languageSettings.voice_default_language === code) {
          languageSettings.voice_default_language = languageSettings.primary_language;
        }
      } else {
        // Ajouter la langue
        languageSettings.active_languages.push(code);
      }
    };
    
    const addTranslation = () => {
      const newTranslation = {
        key: '',
        values: {}
      };
      
      // Initialiser les valeurs pour toutes les langues actives
      languageSettings.active_languages.forEach(code => {
        newTranslation.values[code] = '';
      });
      
      customTranslations.value.push(newTranslation);
    };
    
    const removeTranslation = (index) => {
      customTranslations.value.splice(index, 1);
    };
    
    // Cycle de vie
    onMounted(() => {
      fetchLanguageSettings();
    });
    
    return {
      loading,
      error,
      isSaving,
      availableLanguages,
      languageSettings,
      customTranslations,
      activeLanguages,
      voiceLanguages,
      
      fetchLanguageSettings,
      saveSettings,
      isLanguageActive,
      toggleLanguage,
      addTranslation,
      removeTranslation
    };
  }
};
</script>

<style scoped>
.language-settings-container {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.8rem;
  margin: 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.help-text {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.card-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.form-group select[multiple] {
  height: 150px;
}

.input-help {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #6c757d;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input {
  width: auto;
}

.checkbox-group label {
  margin-bottom: 0;
}

.languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.language-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.language-item:hover {
  background-color: #f8f9fa;
}

.language-item.active {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.05);
}

.language-flag {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.language-flag img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.language-info {
  flex: 1;
}

.language-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}

.language-info p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.language-toggle {
  margin-left: 1rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-switch label:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

.toggle-switch input:checked + label {
  background-color: #007bff;
}

.toggle-switch input:checked + label:before {
  transform: translateX(26px);
}

.custom-translations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.translations-header {
  display: flex;
  font-weight: 600;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.translation-key {
  flex: 1;
  padding: 0 0.5rem;
}

.translation-value {
  flex: 1;
  padding: 0 0.5rem;
}

.translation-actions {
  width: 50px;
  display: flex;
  justify-content: center;
}

.translation-row {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f8f9fa;
}

.translation-row input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #ced4da;
  background-color: white;
  color: #495057;
  cursor: pointer;
}

.btn-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.btn-danger:hover {
  background-color: #dc3545;
  color: white;
}

.add-translation {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  border: 1px solid #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0069d9;
  border-color: #0062cc;
}

.btn-outline {
  background-color: white;
  border: 1px solid #6c757d;
  color: #6c757d;
}

.btn-outline:hover {
  background-color: #f8f9fa;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #007bff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .page-header button {
    width: 100%;
  }
  
  .languages-grid {
    grid-template-columns: 1fr;
  }
  
  .translation-row {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    padding: 1rem 0;
  }
  
  .translation-key,
  .translation-value {
    padding: 0;
  }
  
  .translation-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }
  
  .translations-header {
    display: none;
  }
}
</style>
