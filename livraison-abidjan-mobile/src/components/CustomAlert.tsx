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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  isPrimary?: boolean;
  icon?: string;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirmation' | 'payment' | 'location';
  icon?: string;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  soundEnabled?: boolean;
  customStyle?: object;
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
  dismissAfter = 5000,
  priority = 'medium',
  soundEnabled = true,
  customStyle = {},
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Feedback haptique intelligent selon le type
      switch (type) {
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Animation d'entrée sophistiquée
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 120,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Animation de secousse pour les erreurs critiques
      if (type === 'error' && priority === 'critical') {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();
      }

      // Auto-dismiss intelligent
      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, dismissAfter);
        return () => clearTimeout(timer);
      }
    } else {
      // Animation de sortie fluide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type, priority]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    // Feedback haptique contextuel
    switch (button.style) {
      case 'destructive':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'primary':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      default:
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
          colors: ['#4CAF50', '#45A049', '#388E3C'] as const,
          icon: icon || 'checkmark-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          shadowColor: '#4CAF50',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#F57C00', '#E65100'] as const,
          icon: icon || 'warning',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          shadowColor: '#FF9800',
        };
      case 'error':
        return {
          colors: ['#F44336', '#D32F2F', '#B71C1C'] as const,
          icon: icon || 'close-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          shadowColor: '#F44336',
        };
      case 'payment':
        return {
          colors: ['#9C27B0', '#7B1FA2', '#4A148C'] as const,
          icon: icon || 'card',
          iconColor: '#FFFFFF',
          backgroundColor: '#F3E5F5',
          borderColor: '#9C27B0',
          shadowColor: '#9C27B0',
        };
      case 'location':
        return {
          colors: ['#00BCD4', '#0097A7', '#006064'] as const,
          icon: icon || 'location',
          iconColor: '#FFFFFF',
          backgroundColor: '#E0F2F1',
          borderColor: '#00BCD4',
          shadowColor: '#00BCD4',
        };
      case 'confirmation':
        return {
          colors: ['#2196F3', '#1976D2', '#0D47A1'] as const,
          icon: icon || 'help-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          shadowColor: '#2196F3',
        };
      default:
        return {
          colors: ['#607D8B', '#455A64', '#263238'] as const,
          icon: icon || 'information-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#ECEFF1',
          borderColor: '#607D8B',
          shadowColor: '#607D8B',
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
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    return buttons.map((button, index) => {
      const isPrimary = button.isPrimary || button.style === 'primary';
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
            { borderColor: typeConfig.borderColor },
          ]}
          onPress={() => handleButtonPress(button)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            {button.icon && (
              <Ionicons
                name={button.icon as any}
                size={18}
                color={isPrimary ? '#FFFFFF' : typeConfig.borderColor}
                style={styles.buttonIcon}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                isPrimary && styles.primaryButtonText,
                isDestructive && styles.destructiveButtonText,
                isCancel && styles.cancelButtonText,
                { color: isPrimary ? '#FFFFFF' : typeConfig.borderColor },
              ]}
            >
              {button.text}
            </Text>
          </View>
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
      statusBarTranslucent
    >
      <StatusBar backgroundColor="rgba(0, 0, 0, 0.6)" barStyle="light-content" />
      
      <BlurView intensity={80} style={styles.blurContainer}>
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
              customStyle,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                  { translateX: shakeAnim },
                ],
                shadowColor: typeConfig.shadowColor,
              },
            ]}
          >
            {/* Header avec gradient */}
            <LinearGradient
              colors={typeConfig.colors}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={typeConfig.icon as any}
                  size={36}
                  color={typeConfig.iconColor}
                />
              </View>
              
              {/* Effet de brillance */}
              <View style={styles.shineEffect} />
            </LinearGradient>

            {/* Contenu principal */}
            <View style={[styles.content, { backgroundColor: typeConfig.backgroundColor }]}>
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleDismiss}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}

              <View style={styles.textContainer}>
                <Text style={[styles.title, { color: typeConfig.borderColor }]}>
                  {title}
                </Text>
                {message && (
                  <Text style={styles.message}>
                    {message}
                  </Text>
                )}
              </View>

              {/* Ligne de séparation subtile */}
              <View style={[styles.separator, { backgroundColor: typeConfig.borderColor }]} />

              {/* Boutons d'action */}
              <View style={[
                styles.buttonContainer,
                buttons.length > 1 && styles.multiButtonContainer
              ]}>
                {renderButtons()}
              </View>
            </View>

            {/* Indicateur de priorité */}
            {priority === 'critical' && (
              <View style={[styles.priorityIndicator, { backgroundColor: typeConfig.borderColor }]} />
            )}
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    width: Math.min(width * 0.9, 400),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: {
        elevation: 25,
      },
    }),
  },
  headerGradient: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  shineEffect: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  content: {
    padding: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  textContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  separator: {
    height: 1,
    marginBottom: 20,
    opacity: 0.1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  multiButtonContainer: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  multiButton: {
    marginBottom: 12,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
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
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});

export default CustomAlert;
