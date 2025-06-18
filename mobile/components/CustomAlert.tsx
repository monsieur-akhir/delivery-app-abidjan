import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  isPrimary?: boolean;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirmation';
  icon?: string;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [],
  type = 'info',
  icon,
  onDismiss,
  showCloseButton = true,
  autoDismiss = false,
  dismissAfter = 3000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss si activé
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, dismissAfter);
        return () => clearTimeout(timer);
      }
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    // Feedback haptique
    if (button.style === 'destructive') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (button.isPrimary) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (button.onPress) {
      button.onPress();
    }
    handleDismiss();
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#4CAF50', '#45A049'],
          icon: icon || 'checkmark-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#F57C00'],
          icon: icon || 'warning',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
        };
      case 'error':
        return {
          colors: ['#F44336', '#D32F2F'],
          icon: icon || 'close-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
        };
      case 'confirmation':
        return {
          colors: ['#2196F3', '#1976D2'],
          icon: icon || 'help-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
        };
      default:
        return {
          colors: ['#607D8B', '#455A64'],
          icon: icon || 'information-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#ECEFF1',
          borderColor: '#607D8B',
        };
    }
  };

  const typeConfig = getTypeConfig();

  const renderButtons = () => {
    if (buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleDismiss}
        >
          <Text style={styles.primaryButtonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    return buttons.map((button, index) => {
      const isPrimary = button.isPrimary || (buttons.length === 1);
      const isDestructive = button.style === 'destructive';
      const isCancel = button.style === 'cancel';

      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.button,
            isPrimary && styles.primaryButton,
            isDestructive && styles.destructiveButton,
            isCancel && styles.cancelButton,
            buttons.length > 1 && styles.multiButton,
          ]}
          onPress={() => handleButtonPress(button)}
        >
          <Text
            style={[
              styles.buttonText,
              isPrimary && styles.primaryButtonText,
              isDestructive && styles.destructiveButtonText,
              isCancel && styles.cancelButtonText,
            ]}
          >
            {button.text}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleDismiss}
        />
        
        <Animated.View
          style={[
            styles.alertContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={typeConfig.colors}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={typeConfig.icon as any}
                size={32}
                color={typeConfig.iconColor}
              />
            </View>
          </LinearGradient>

          <View style={[styles.content, { backgroundColor: typeConfig.backgroundColor }]}>
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleDismiss}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}

            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>

            <View style={[
              styles.buttonContainer,
              buttons.length > 1 && styles.multiButtonContainer
            ]}>
              {renderButtons()}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  alertContainer: {
    width: Math.min(width * 0.9, 400),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  headerGradient: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  textContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  multiButtonContainer: {
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  multiButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  destructiveButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  cancelButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#DC2626',
  },
  cancelButtonText: {
    color: '#6B7280',
  },
});

export default CustomAlert; 