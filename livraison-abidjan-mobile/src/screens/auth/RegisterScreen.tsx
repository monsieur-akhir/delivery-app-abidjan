import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { Button } from 'react-native-paper';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';
import { useNetwork } from '../../contexts/NetworkContext';
import { colors } from '../../styles/colors';
import i18n from '../../i18n';
import CustomErrorModal from '../../components/CustomErrorModal';
import CustomLoaderModal from '../../components/CustomLoaderModal';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { signUp, sendOTP } = useAuth();
  const { isConnected, isOfflineMode, toggleOfflineMode } = useNetwork();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'client' as 'client' | 'courier',
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [isI18nReady, setIsI18nReady] = useState(i18n.isInitialized);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalConfig, setErrorModalConfig] = useState({ title: '', message: '' });

  useEffect(() => {
    if (!i18n.isInitialized) {
      i18n.on("initialized", () => setIsI18nReady(true));
    }
  }, []);

  useEffect(() => {
    if (!isConnected && !isOfflineMode) {
      setShowOfflineWarning(true);
    } else {
      setShowOfflineWarning(false);
    }
  }, [isConnected, isOfflineMode]);

  if (!isI18nReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.orange} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const cleanPhoneNumber = (input: string) => {
    let cleaned = input.replace(/\D/g, '');
    if (cleaned.startsWith('225')) cleaned = cleaned.slice(3);
    if (cleaned.startsWith('00225')) cleaned = cleaned.slice(5);
    return cleaned;
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = t('register.errors.nameRequired');
    } else if (formData.name.length < 2) {
      errors.name = t('register.errors.nameMinLength');
    }

    if (!formData.email.trim()) {
      errors.email = t('register.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('register.errors.emailInvalid');
    }

    if (!formData.phone.trim()) {
      errors.phone = t('register.errors.phoneRequired');
    } else {
      const cleaned = cleanPhoneNumber(formData.phone);
      if (cleaned.length !== 10) {
        errors.phone = t('register.errors.phone10Digits');
      } else if (/^(\+|00|225)/.test(formData.phone)) {
        errors.phone = t('register.errors.phoneNoPrefix');
      }
    }

    if (!formData.password) {
      errors.password = t('register.errors.passwordRequired');
    } else if (formData.password.length < 6) {
      errors.password = t('register.errors.passwordMinLength');
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t('register.errors.confirmPasswordRequired');
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('register.errors.passwordMismatch');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!isConnected && !isOfflineMode) {
      setErrorModalConfig({ title: t('register.errors.noConnection') || 'Erreur de connexion', message: t('register.errors.noConnection') || 'Erreur de connexion' });
      setErrorModalVisible(true);
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorModalConfig({ title: t('register.errors.emailInvalid') || 'Adresse email invalide', message: t('register.errors.emailInvalid') || 'Adresse email invalide' });
      setErrorModalVisible(true);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorModalConfig({ title: t('register.errors.passwordMismatch') || 'Les mots de passe ne correspondent pas', message: t('register.errors.passwordMismatch') || 'Les mots de passe ne correspondent pas' });
      setErrorModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      // Inscription avec envoi automatique d'OTP
      await signUp({
        full_name: formData.name,
        email: formData.email,
        phone: cleanPhoneNumber(formData.phone),
        password: formData.password,
        role: formData.userType,
      });
      
      // Redirection vers la vérification OTP
      navigation.replace('VerifyOTP', {
        phoneNumber: formData.phone,
        isRegistration: true,
        role: formData.userType,
      });
      
    } catch (error: any) {
      let errorMessage = t('register.errors.generic');
      
      if (error.response) {
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (typeof error.response.data === 'object') {
            errorMessage = JSON.stringify(error.response.data);
          }
        } else if (error.response.statusText) {
          errorMessage = error.response.statusText;
        }
      } else if (error.data) {
        if (typeof error.data === 'string') {
          errorMessage = error.data;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else if (error.data.detail) {
          errorMessage = error.data.detail;
        } else if (typeof error.data === 'object') {
          errorMessage = JSON.stringify(error.data);
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      if (errorMessage && errorMessage.toLowerCase().includes('phone')) {
        errorMessage = t('register.errors.phoneExists') || 'Ce numéro de téléphone est déjà utilisé';
      } else if (errorMessage && (errorMessage.toLowerCase().includes('email existe') || errorMessage.toLowerCase().includes('email already') || errorMessage.toLowerCase().includes('email'))) {
        errorMessage = t('register.errors.emailExists') || 'Cette adresse email est déjà utilisée';
      } else if (errorMessage && errorMessage.toLowerCase().includes('email invalide')) {
        errorMessage = t('register.errors.emailInvalid') || 'Adresse email invalide';
      } else if (errorMessage && errorMessage.toLowerCase().includes('password')) {
        errorMessage = t('register.errors.passwordMismatch') || 'Les mots de passe ne correspondent pas';
      } else if (errorMessage && errorMessage.toLowerCase().includes('network')) {
        errorMessage = t('register.errors.networkError') || 'Erreur de connexion réseau';
      }
      
      setErrorModalConfig({ title: 'Erreur d\'inscription', message: errorMessage });
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    toggleOfflineMode(true);
    setShowOfflineWarning(false);
  };

  const updateFormData = (field: string, value: string) => {
    if (field === 'phone') {
      let cleaned = value.replace(/\D/g, '');
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: cleaned }));
      if (formErrors[field]) {
        setFormErrors(prev => ({ ...prev, [field]: '' }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ ...styles.scrollContent, minHeight: '100%' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.darkGray} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.title}>{t('register.title')}</Text>
          <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
          <View style={styles.userTypeButtons}>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                formData.userType === 'client' && styles.userTypeButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, userType: 'client' })}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="account" size={22} color={formData.userType === 'client' ? colors.white : colors.gray} />
              <Text style={[
                styles.userTypeButtonText,
                formData.userType === 'client' && styles.userTypeButtonTextActive,
              ]}>{t('roles.client')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.userTypeButton,
                formData.userType === 'courier' && styles.userTypeButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, userType: 'courier' })}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="motorbike" size={22} color={formData.userType === 'courier' ? colors.white : colors.gray} />
              <Text style={[
                styles.userTypeButtonText,
                formData.userType === 'courier' && styles.userTypeButtonTextActive,
              ]}>{t('roles.courier')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'name' && styles.inputWrapperFocused,
              formErrors.name && styles.inputError,
            ]}>
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(value) => setFormData({ ...formData, name: value })}
                placeholder={t('register.fullName')}
                placeholderTextColor={colors.gray}
                autoCapitalize="words"
                returnKeyType="next"
                underlineColorAndroid="transparent"
                selectionColor={colors.orange}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputWrapperFocused,
              formErrors.email && styles.inputError,
            ]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(value) => setFormData({ ...formData, email: value })}
                placeholder={t('register.email')}
                placeholderTextColor={colors.gray}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                underlineColorAndroid="transparent"
                selectionColor={colors.orange}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'phone' && styles.inputWrapperFocused,
              formErrors.phone && styles.inputError,
            ]}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                placeholder={t('register.phone')}
                placeholderTextColor={colors.gray}
                keyboardType="phone-pad"
                returnKeyType="next"
                underlineColorAndroid="transparent"
                selectionColor={colors.orange}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'password' && styles.inputWrapperFocused,
              formErrors.password && styles.inputError,
            ]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(value) => setFormData({ ...formData, password: value })}
                placeholder={t('register.password')}
                placeholderTextColor={colors.gray}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                underlineColorAndroid="transparent"
                selectionColor={colors.orange}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <View style={[
              styles.inputWrapper,
              focusedField === 'confirmPassword' && styles.inputWrapperFocused,
              formErrors.confirmPassword && styles.inputError,
            ]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={formData.confirmPassword}
                onChangeText={(value) => setFormData({ ...formData, confirmPassword: value })}
                placeholder={t('register.confirmPassword')}
                placeholderTextColor={colors.gray}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                underlineColorAndroid="transparent"
                selectionColor={colors.orange}
                onFocus={() => setFocusedField('confirmPassword')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} style={styles.eyeButton}>
                <MaterialCommunityIcons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>
          </View>
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.registerButton}
            labelStyle={styles.registerButtonText}
            contentStyle={{ height: 54 }}
            disabled={loading}
          >
            {t('register.submit')}
          </Button>
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            accessibilityRole="link"
          >
            {t('register.alreadyAccount')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomErrorModal
        visible={errorModalVisible}
        onDismiss={() => setErrorModalVisible(false)}
        title={errorModalConfig.title}
        message={errorModalConfig.message}
      />
      
      <CustomLoaderModal
        visible={loading}
        title="Inscription en cours..."
        message="Veuillez patienter pendant que nous créons votre compte"
        type="loading"
        onDismiss={() => setLoading(false)}
        timeoutMs={30000}
        timeoutMessage="L'inscription prend plus de temps que prévu. Veuillez vérifier votre connexion ou réessayer."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 32,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 8,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 0,
    marginBottom: 0,
    width: '100%',
  },
  logo: {
    width: 200,
    height: 200,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    color: '#222',
  },
  subtitle: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 16,
    marginBottom: 28,
  },
  userTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
    width: '100%',
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 1,
  },
  userTypeButtonActive: {
    backgroundColor: colors.orange,
    shadowColor: colors.orange,
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  userTypeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray,
    marginLeft: 8,
  },
  userTypeButtonTextActive: {
    color: colors.white,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWrapperFocused: {
    borderColor: colors.orange,
    shadowColor: colors.orange,
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 17,
    color: colors.darkGray,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: colors.orange,
    borderRadius: 16,
    marginTop: 32,
    width: '100%',
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
  },
  loginLink: {
    marginTop: 28,
    textAlign: 'center',
    color: colors.orange,
    fontWeight: '600',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;