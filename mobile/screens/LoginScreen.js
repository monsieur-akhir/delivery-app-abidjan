import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('enas@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    // Simuler une requête de connexion
    setTimeout(() => {
      setIsLoading(false);
      // navigation.navigate('Home'); // Décommenter pour la navigation réelle
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo ou image d'en-tête */}
          <View style={styles.header}>
            <Image 
              source={require('./assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
          </View>

          {/* Titres */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Sign to your account</Text>
          </View>

          {/* Formulaire */}
          <View style={styles.formContainer}>
            {/* Champ Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Email</Text>
              <View style={styles.emailContainer}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={false} // Email pré-rempli et non modifiable dans cet exemple
                />
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={24} 
                  color="#4CAF50" 
                  style={styles.verifiedIcon} 
                />
              </View>
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={24} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Lien Mot de passe oublié */}
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Bouton de connexion */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Or</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Boutons sociaux */}
            <View style={styles.socialButtons}>
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={require('./assets/facebook-icon.png')} 
                  style={styles.socialIcon} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={require('./assets/google-icon.png')} 
                  style={styles.socialIcon} 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Image 
                  source={require('./assets/apple-icon.png')} 
                  style={styles.socialIcon} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Lien d'inscription */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>I don't have account</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  emailContainer: {
    position: 'relative',
  },
  verifiedIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  linkText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4285F4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginBottom: 24,
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  separatorText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  socialIcon: {
    width: 24,
    height: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default LoginScreen;