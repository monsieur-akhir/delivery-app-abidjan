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
import CustomAlert from '../../components/CustomAlert';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Register">
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' as 'info' | 'error' | 'success' });

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
    } else if (!/^[\+]?[0-9\-\(\)\s]+$/.test(formData.phone)) {
      errors.phone = t('register.errors.phoneInvalid');
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
      setAlertConfig({ title: 'Erreur de connexion', message: t('register.errors.noConnection'), type: 'error' });
      setAlertVisible(true);
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.userType,
      });

      setAlertConfig({ title: 'Succès', message: t('register.success'), type: 'success' });
      setAlertVisible(true);

      setTimeout(() => {
        setAlertVisible(false);
        navigation.navigate('Login');
      }, 2000);
    } catch (error: any) {
      setAlertConfig({ title: 'Erreur', message: error.message || t('register.errors.generic'), type: 'error' });
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    toggleOfflineMode(true);
    setShowOfflineWarning(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.darkGray} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t('register.title')}</Text>
              <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
            </View>
          </Animatable.View>

          {/* Offline Warning */}
          {showOfflineWarning && (
            <Animatable.View animation="slideInDown" duration={500} style={styles.offlineWarning}>
              <MaterialCommunityIcons name="wifi-off" size={20} color="#E65100" />
              <View style={styles.offlineTextContainer}>
                <Text style={styles.offlineTitle}>{t('register.offline.title')}</Text>
                <Text style={styles.offlineText}>{t('register.offline.message')}</Text>
              </View>
              <TouchableOpacity style={styles.offlineButton} onPress={handleOfflineMode}>
                <Text style={styles.offlineButtonText}>{t('register.offline.continue')}</Text>
              </TouchableOpacity>
            </Animatable.View>
          )}

          {/* User Type Selection */}
          <Animatable.View animation="fadeInUp" duration={800} delay={200} style={styles.userTypeContainer}>
            <Text style={styles.sectionTitle}>{t('register.userType.title')}</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'client' && styles.userTypeButtonActive
                ]}
                onPress={() => updateFormData('userType', 'client')}
              >
                <MaterialCommunityIcons 
                  name="account" 
                  size={24} 
                  color={formData.userType === 'client' ? colors.white : colors.gray} 
                />
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'client' && styles.userTypeButtonTextActive
                ]}>
                  {t('register.userType.client')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'courier' && styles.userTypeButtonActive
                ]}
                onPress={() => updateFormData('userType', 'courier')}
              >
                <MaterialCommunityIcons 
                  name="motorbike" 
                  size={24} 
                  color={formData.userType === 'courier' ? colors.white : colors.gray} 
                />
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'courier' && styles.userTypeButtonTextActive
                ]}>
                  {t('register.userType.courier')}
                </Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>

          {/* Form Fields */}
          <Animatable.View animation="fadeInUp" duration={800} delay={400} style={styles.formContainer}>
            {/* Name Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('register.fields.name')}</Text>
              <View style={[styles.inputWrapper, formErrors.name && styles.inputError]}>
                <MaterialCommunityIcons name="account-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  placeholder={t('register.placeholders.name')}
                  placeholderTextColor={colors.gray}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
              {formErrors.name && <Text style={styles.errorText}>{formErrors.name}</Text>}
            </View>

            {/* Email Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('register.fields.email')}</Text>
              <View style={[styles.inputWrapper, formErrors.email && styles.inputError]}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  placeholder={t('register.placeholders.email')}
                  placeholderTextColor={colors.gray}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
              {formErrors.email && <Text style={styles.errorText}>{formErrors.email}</Text>}
            </View>

            {/* Phone Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('register.fields.phone')}</Text>
              <View style={[styles.inputWrapper, formErrors.phone && styles.inputError]}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.phone}
                  onChangeText={(value) => updateFormData('phone', value)}
                  placeholder={t('register.placeholders.phone')}
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />
              </View>
              {formErrors.phone && <Text style={styles.errorText}>{formErrors.phone}</Text>}
            </View>

            {/* Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('register.fields.password')}</Text>
              <View style={[styles.inputWrapper, formErrors.password && styles.inputError]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder={t('register.placeholders.password')}
                  placeholderTextColor={colors.gray}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {formErrors.password && <Text style={styles.errorText}>{formErrors.password}</Text>}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('register.fields.confirmPassword')}</Text>
              <View style={[styles.inputWrapper, formErrors.confirmPassword && styles.inputError]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder={t('register.placeholders.confirmPassword')}
                  placeholderTextColor={colors.gray}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {formErrors.confirmPassword && <Text style={styles.errorText}>{formErrors.confirmPassword}</Text>}
            </View>
          </Animatable.View>

          {/* Register Button */}
          <Animatable.View animation="fadeInUp" duration={800} delay={600} style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading || (!isConnected && !isOfflineMode)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>{t('register.submit')}</Text>
              )}
            </TouchableOpacity>
          </Animatable.View>

          {/* Login Link */}
          <Animatable.View animation="fadeIn" duration={800} delay={800} style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('register.haveAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('register.loginLink')}</Text>
            </TouchableOpacity>
          </Animatable.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        onDismiss={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.darkGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 24,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  offlineTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  offlineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  offlineText: {
    fontSize: 12,
    color: '#E65100',
    opacity: 0.8,
  },
  offlineButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  offlineButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  userTypeContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.darkGray,
    marginBottom: 16,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  userTypeButtonActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  userTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray,
    marginLeft: 8,
  },
  userTypeButtonTextActive: {
    color: colors.white,
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.darkGray,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.darkGray,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  registerButton: {
    backgroundColor: colors.orange,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginText: {
    fontSize: 14,
    color: colors.gray,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.orange,
    marginLeft: 4,
  },
};

export default RegisterScreen;