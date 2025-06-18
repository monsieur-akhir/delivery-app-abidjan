
import { useState, useCallback, useRef } from 'react';
import { AlertButton } from '../components/CustomAlert';
import { ToastAction } from '../components/CustomToast';

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirmation' | 'payment' | 'location';
  icon?: string;
  showCloseButton?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  soundEnabled?: boolean;
  customStyle?: object;
}

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'payment' | 'delivery';
  duration?: number;
  action?: ToastAction;
  icon?: string;
  title?: string;
  position?: 'top' | 'bottom';
  swipeable?: boolean;
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

  const alertQueue = useRef<AlertOptions[]>([]);
  const toastQueue = useRef<ToastOptions[]>([]);

  // Méthodes pour les alertes
  const showAlert = useCallback((options: AlertOptions) => {
    if (alertVisible) {
      // Ajouter à la queue si une alerte est déjà visible
      alertQueue.current.push(options);
      return;
    }
    
    setAlertConfig(options);
    setAlertVisible(true);
  }, [alertVisible]);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
    
    // Traiter la queue
    setTimeout(() => {
      if (alertQueue.current.length > 0) {
        const nextAlert = alertQueue.current.shift();
        if (nextAlert) {
          showAlert(nextAlert);
        }
      }
    }, 300);
  }, [showAlert]);

  // Méthodes pour les toasts
  const showToast = useCallback((options: ToastOptions) => {
    if (toastVisible) {
      // Ajouter à la queue si un toast est déjà visible
      toastQueue.current.push(options);
      return;
    }
    
    setToastConfig(options);
    setToastVisible(true);
  }, [toastVisible]);

  const hideToast = useCallback(() => {
    setToastVisible(false);
    
    // Traiter la queue
    setTimeout(() => {
      if (toastQueue.current.length > 0) {
        const nextToast = toastQueue.current.shift();
        if (nextToast) {
          showToast(nextToast);
        }
      }
    }, 300);
  }, [showToast]);

  // Méthodes utilitaires pour les alertes courantes
  const showSuccessAlert = useCallback((title: string, message?: string, options?: Partial<AlertOptions>) => {
    showAlert({
      title,
      message,
      type: 'success',
      icon: 'checkmark-circle',
      priority: 'medium',
      ...options,
    });
  }, [showAlert]);

  const showErrorAlert = useCallback((title: string, message?: string, options?: Partial<AlertOptions>) => {
    showAlert({
      title,
      message,
      type: 'error',
      icon: 'close-circle',
      priority: 'high',
      ...options,
    });
  }, [showAlert]);

  const showWarningAlert = useCallback((title: string, message?: string, options?: Partial<AlertOptions>) => {
    showAlert({
      title,
      message,
      type: 'warning',
      icon: 'warning',
      priority: 'medium',
      ...options,
    });
  }, [showAlert]);

  const showInfoAlert = useCallback((title: string, message?: string, options?: Partial<AlertOptions>) => {
    showAlert({
      title,
      message,
      type: 'info',
      icon: 'information-circle',
      priority: 'low',
      ...options,
    });
  }, [showAlert]);

  const showPaymentAlert = useCallback((title: string, message?: string, options?: Partial<AlertOptions>) => {
    showAlert({
      title,
      message,
      type: 'payment',
      icon: 'card',
      priority: 'high',
      ...options,
    });
  }, [showAlert]);

  const showLocationAlert = useCallback((title: string, message?: string, options?: Partial<AlertOptions>) => {
    showAlert({
      title,
      message,
      type: 'location',
      icon: 'location',
      priority: 'medium',
      ...options,
    });
  }, [showAlert]);

  const showConfirmationAlert = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      options?: Partial<AlertOptions>
    ) => {
      showAlert({
        title,
        message,
        type: 'confirmation',
        icon: 'help-circle',
        priority: 'medium',
        buttons: [
          {
            text: 'Annuler',
            style: 'cancel',
            icon: 'close',
            onPress: onCancel,
          },
          {
            text: 'Confirmer',
            style: 'primary',
            icon: 'checkmark',
            isPrimary: true,
            onPress: onConfirm,
          },
        ],
        ...options,
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
        priority: 'high',
        buttons: [
          {
            text: 'Annuler',
            style: 'cancel',
            icon: 'close',
            onPress: onCancel,
          },
          {
            text: 'Supprimer',
            style: 'destructive',
            icon: 'trash',
            isPrimary: true,
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert]
  );

  // Méthodes utilitaires pour les toasts courants
  const showSuccessToast = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    showToast({
      message,
      title,
      type: 'success',
      icon: 'checkmark-circle',
      duration: 3000,
      ...options,
    });
  }, [showToast]);

  const showErrorToast = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    showToast({
      message,
      title,
      type: 'error',
      icon: 'close-circle',
      duration: 4000,
      ...options,
    });
  }, [showToast]);

  const showWarningToast = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    showToast({
      message,
      title,
      type: 'warning',
      icon: 'warning',
      duration: 4000,
      ...options,
    });
  }, [showToast]);

  const showInfoToast = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    showToast({
      message,
      title,
      type: 'info',
      icon: 'information-circle',
      duration: 3000,
      ...options,
    });
  }, [showToast]);

  const showPaymentToast = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    showToast({
      message,
      title,
      type: 'payment',
      icon: 'card',
      duration: 4000,
      ...options,
    });
  }, [showToast]);

  const showDeliveryToast = useCallback((message: string, title?: string, options?: Partial<ToastOptions>) => {
    showToast({
      message,
      title,
      type: 'delivery',
      icon: 'bicycle',
      duration: 3000,
      ...options,
    });
  }, [showToast]);

  // Méthodes de gestion des queues
  const clearAlertQueue = useCallback(() => {
    alertQueue.current = [];
  }, []);

  const clearToastQueue = useCallback(() => {
    toastQueue.current = [];
  }, []);

  const clearAllQueues = useCallback(() => {
    clearAlertQueue();
    clearToastQueue();
  }, [clearAlertQueue, clearToastQueue]);

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
    showPaymentAlert,
    showLocationAlert,
    showConfirmationAlert,
    showDeleteConfirmationAlert,

    // Méthodes pour les toasts
    showToast,
    hideToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    showPaymentToast,
    showDeliveryToast,

    // Gestion des queues
    clearAlertQueue,
    clearToastQueue,
    clearAllQueues,
  };
};
