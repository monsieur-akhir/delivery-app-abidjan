
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';

/**
 * Hook pour synchroniser AuthService avec AuthContext
 */
export const useTokenSync = () => {
  const { signOut, setAuthData } = useAuth();

  useEffect(() => {
    // Configurer les callbacks de AuthService pour notifier les contexts
    AuthService.setTokenCallbacks(
      // Callback d'expiration de token
      () => {
        console.log('[TokenSync] Token expiré, déconnexion automatique');
        signOut(true);
      },
      // Callback de rafraîchissement de token
      (newToken: string) => {
        console.log('[TokenSync] Token rafraîchi automatiquement');
        // Le token sera mis à jour via les intercepteurs d'AuthService
      }
    );

    return () => {
      // Nettoyer les callbacks
      AuthService.setTokenCallbacks(() => {}, () => {});
    };
  }, [signOut, setAuthData]);
};
