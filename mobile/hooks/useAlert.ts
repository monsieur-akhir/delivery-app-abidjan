import { useState, useCallback } from 'react';
import { AlertButton } from '../components/CustomAlert';

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirmation';
  icon?: string;
  showCloseButton?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
}

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: string;
  title?: string;
}

export const useAlert = () => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastConfig, setToastConfig] = useState<ToastOptions>({
    message: '',
    type: 'info',
  });

  // Méthodes pour les alertes
  const showAlert = useCallback((options: AlertOptions) => {
    setAlertConfig(options);
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  // Méthodes pour les toasts
  const showToast = useCallback((options: ToastOptions) => {
    setToastConfig(options);
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  // Méthodes utilitaires pour les alertes courantes
  const showSuccessAlert = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'success',
      icon: 'checkmark-circle',
    });
  }, [showAlert]);

  const showErrorAlert = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'error',
      icon: 'close-circle',
    });
  }, [showAlert]);

  const showWarningAlert = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'warning',
      icon: 'warning',
    });
  }, [showAlert]);

  const showInfoAlert = useCallback((title: string, message?: string) => {
    showAlert({
      title,
      message,
      type: 'info',
      icon: 'information-circle',
    });
  }, [showAlert]);

  const showConfirmationAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText = 'Confirmer',
      cancelText = 'Annuler'
    ) => {
      showAlert({
        title,
        message,
        type: 'confirmation',
        icon: 'help-circle',
        buttons: [
          {
            text: cancelText,
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: confirmText,
            style: 'default',
            isPrimary: true,
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  const showDeleteConfirmationAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      showAlert({
        title,
        message,
        type: 'error',
        icon: 'trash',
        buttons: [
          {
            text: 'Annuler',
            style: 'cancel',
            onPress: onCancel,
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            isPrimary: true,
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  // Méthodes utilitaires pour les toasts courants
  const showSuccessToast = useCallback((message: string, title?: string) => {
    showToast({
      message,
      title,
      type: 'success',
      icon: 'checkmark-circle',
    });
  }, [showToast]);

  const showErrorToast = useCallback((message: string, title?: string) => {
    showToast({
      message,
      title,
      type: 'error',
      icon: 'close-circle',
    });
  }, [showToast]);

  const showWarningToast = useCallback((message: string, title?: string) => {
    showToast({
      message,
      title,
      type: 'warning',
      icon: 'warning',
    });
  }, [showToast]);

  const showInfoToast = useCallback((message: string, title?: string) => {
    showToast({
      message,
      title,
      type: 'info',
      icon: 'information-circle',
    });
  }, [showToast]);

  return {
    // État des alertes et toasts
    alertVisible,
    alertConfig,
    toastVisible,
    toastConfig,

    // Méthodes pour les alertes
    showAlert,
    hideAlert,
    showSuccessAlert,
    showErrorAlert,
    showWarningAlert,
    showInfoAlert,
    showConfirmationAlert,
    showDeleteConfirmationAlert,

    // Méthodes pour les toasts
    showToast,
    hideToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
  };
}; 