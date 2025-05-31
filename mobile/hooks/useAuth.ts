import { useState, useCallback, useEffect } from 'react';
import AuthService, { 
  LoginRequest, 
  RegisterRequest,
  PasswordResetConfirm,
  PasswordChangeRequest,
  OTPRequest,
  OTPVerification,
  AuthResponse
} from '../services/AuthService';
import { User } from '../types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthHook extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (phone: string) => Promise<void>;
  confirmPasswordReset: (data: PasswordResetConfirm) => Promise<void>;
  changePassword: (data: PasswordChangeRequest) => Promise<void>;
  sendOTP: (request: OTPRequest) => Promise<void>;
  verifyOTP: (verification: OTPVerification) => Promise<void>;
  resendOTP: (phone: string, otpType: 'login' | 'registration' | 'password_reset') => Promise<void>;
  enableTwoFactor: () => Promise<{ qr_code: string; backup_codes: string[] }>;
  disableTwoFactor: (code: string) => Promise<void>;
  verifyToken: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuth = (): AuthHook => {  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Vérification du statut d'authentification au démarrage
  const checkAuthStatus = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const token = await AuthService.getToken();
      const user = await AuthService.getUser();
      
      if (token && user) {
        const isValid = await AuthService.verifyToken();
        if (isValid) {
          setState(prev => ({
            ...prev,
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          }));
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      setState(prev => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
      }));
    }
  }, []);

  // Connexion
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const authResponse: AuthResponse = await AuthService.login(credentials);
      
      setState(prev => ({
        ...prev,
        user: authResponse.user,
        token: authResponse.access_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, []);

  // Inscription
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const user: User = await AuthService.register(data);
      
      setState(prev => ({
        ...prev,
        user,
        token: null, // L'utilisateur devra se connecter après inscription
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  }, []);

  // Déconnexion
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await AuthService.logout();
      
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout même en cas d'erreur
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  // Demande de réinitialisation de mot de passe
  const requestPasswordReset = useCallback(async (phone: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.requestPasswordReset({ phone });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset request';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Confirmation de réinitialisation du mot de passe
  const confirmPasswordReset = useCallback(async (data: PasswordResetConfirm) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.confirmPasswordReset(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Changement de mot de passe
  const changePassword = useCallback(async (data: PasswordChangeRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.changePassword(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Envoi OTP
  const sendOTP = useCallback(async (request: OTPRequest) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.sendOTP(request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Vérification OTP
  const verifyOTP = useCallback(async (verification: OTPVerification) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.verifyOTP(verification);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Renvoi OTP
  const resendOTP = useCallback(async (phone: string, otpType: 'login' | 'registration' | 'password_reset') => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.resendOTP(phone, otpType);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Activation 2FA
  const enableTwoFactor = useCallback(async (): Promise<{ qr_code: string; backup_codes: string[] }> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      return await AuthService.enableTwoFactor();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enable 2FA';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Désactivation 2FA
  const disableTwoFactor = useCallback(async (code: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await AuthService.disableTwoFactor(code);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disable 2FA';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Vérification du token
  const verifyToken = useCallback(async (): Promise<boolean> => {
    try {
      return await AuthService.verifyToken();
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }, []);

  // Effacement des erreurs
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Vérification automatique du statut d'authentification
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);
  return {
    ...state,
    login,
    register,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    sendOTP,
    verifyOTP,
    resendOTP,
    enableTwoFactor,
    disableTwoFactor,
    verifyToken,
    clearError,
  };
};

export default useAuth;
