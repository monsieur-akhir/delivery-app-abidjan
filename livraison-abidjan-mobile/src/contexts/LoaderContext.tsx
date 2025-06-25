import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoaderContextType {
  loading: boolean;
  message: string;
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  showSuccessLoader: (message?: string, duration?: number) => void;
  showErrorLoader: (message?: string, duration?: number) => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const useLoader = () => {
  const context = useContext(LoaderContext);
  if (!context) {
    throw new Error('useLoader must be used within a LoaderProvider');
  }
  return context;
};

interface LoaderProviderProps {
  children: React.ReactNode;
}

export const LoaderProvider: React.FC<LoaderProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Chargement en cours...');
  const [type, setType] = useState<'loading' | 'success' | 'error'>('loading');

  const showLoader = useCallback((message: string = 'Chargement en cours...') => {
    setMessage(message);
    setType('loading');
    setLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setLoading(false);
  }, []);

  const showSuccessLoader = useCallback((message: string = 'Opération réussie !', duration: number = 2000) => {
    setMessage(message);
    setType('success');
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
    }, duration);
  }, []);

  const showErrorLoader = useCallback((message: string = 'Une erreur s\'est produite', duration: number = 3000) => {
    setMessage(message);
    setType('error');
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
    }, duration);
  }, []);

  const value: LoaderContextType = {
    loading,
    message,
    showLoader,
    hideLoader,
    showSuccessLoader,
    showErrorLoader,
  };

  return (
    <LoaderContext.Provider value={value}>
      {children}
    </LoaderContext.Provider>
  );
}; 