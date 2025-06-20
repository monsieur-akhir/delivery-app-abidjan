
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
  disabled?: boolean;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirmation' | 'payment' | 'location' | 'premium' | 'celebration';
  icon?: string;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  soundEnabled?: boolean;
  customStyle?: object;
  animationType?: 'fade' | 'slide' | 'bounce' | 'pulse';
  backdropOpacity?: number;
  persistent?: boolean;
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
  animationType = 'bounce',
  backdropOpacity = 0.7,
  persistent = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Feedback haptique intelligent selon le type
      switch (type) {
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'success':
        case 'celebration':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'premium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Animations d'entrée selon le type
      const getEntranceAnimation = () => {
        switch (animationType) {
          case 'slide':
            return Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.spring(slideAnim, {
                toValue: 0,
                tension: 120,
                friction: 8,
                useNativeDriver: true,
              }),
            ]);
          case 'pulse':
            return Animated.sequence([
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.loop(
                Animated.sequence([
                  Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                  Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                  }),
                ]),
                { iterations: 2 }
              ),
            ]);
          case 'bounce':
          default:
            return Animated.sequence([
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
            ]);
        }
      };

      getEntranceAnimation().start();

      // Animation de brillance continue
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation spéciale pour les erreurs critiques
      if (type === 'error' && priority === 'critical') {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();
      }

      // Animation de célébration pour le succès
      if (type === 'celebration') {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
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
  }, [visible, type, priority, animationType]);

  const handleDismiss = () => {
    if (persistent) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.disabled) return;

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
          colors: ['#4CAF50', '#45A049', '#388E3C', '#2E7D32'] as const,
          icon: icon || 'checkmark-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          shadowColor: '#4CAF50',
          accentColor: '#66BB6A',
        };
      case 'celebration':
        return {
          colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'] as const,
          icon: icon || 'trophy',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF6B6B',
          shadowColor: '#FF6B6B',
          accentColor: '#FFB74D',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#F57C00', '#E65100', '#BF360C'] as const,
          icon: icon || 'warning',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          shadowColor: '#FF9800',
          accentColor: '#FFB74D',
        };
      case 'error':
        return {
          colors: ['#F44336', '#D32F2F', '#B71C1C', '#8E0000'] as const,
          icon: icon || 'close-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          shadowColor: '#F44336',
          accentColor: '#E57373',
        };
      case 'payment':
        return {
          colors: ['#9C27B0', '#7B1FA2', '#4A148C', '#1A0033'] as const,
          icon: icon || 'card',
          iconColor: '#FFFFFF',
          backgroundColor: '#F3E5F5',
          borderColor: '#9C27B0',
          shadowColor: '#9C27B0',
          accentColor: '#BA68C8',
        };
      case 'location':
        return {
          colors: ['#00BCD4', '#0097A7', '#006064', '#00251A'] as const,
          icon: icon || 'location',
          iconColor: '#FFFFFF',
          backgroundColor: '#E0F2F1',
          borderColor: '#00BCD4',
          shadowColor: '#00BCD4',
          accentColor: '#4DD0E1',
        };
      case 'premium':
        return {
          colors: ['#FFD700', '#FFA000', '#FF8F00', '#FF6F00'] as const,
          icon: icon || 'star',
          iconColor: '#FFFFFF',
          backgroundColor: '#FFFDE7',
          borderColor: '#FFD700',
          shadowColor: '#FFD700',
          accentColor: '#FFEB3B',
        };
      case 'confirmation':
        return {
          colors: ['#2196F3', '#1976D2', '#0D47A1', '#002171'] as const,
          icon: icon || 'help-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          shadowColor: '#2196F3',
          accentColor: '#64B5F6',
        };
      default:
        return {
          colors: ['#607D8B', '#455A64', '#263238', '#000A12'] as const,
          icon: icon || 'information-circle',
          iconColor: '#FFFFFF',
          backgroundColor: '#ECEFF1',
          borderColor: '#607D8B',
          shadowColor: '#607D8B',
          accentColor: '#90A4AE',
        };
    }
  };

  const typeConfig = getTypeConfig();

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  const renderButtons = () => {
    if (buttons.length === 0) {
      return (
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            { backgroundColor: typeConfig.borderColor }
          ]}
          onPress={handleDismiss}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="OK"
        >
          <Text style={styles.primaryButtonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    return buttons.map((button, index) => {
      const isPrimary = button.isPrimary || button.style === 'primary';
      const isDestructive = button.style === 'destructive';
      const isCancel = button.style === 'cancel';
      const isDisabled = button.disabled;

      return (
        <TouchableOpacity
          key={index}
          style={[
            styles.button,
            isPrimary && [styles.primaryButton, { backgroundColor: typeConfig.borderColor }],
            isDestructive && styles.destructiveButton,
            isCancel && styles.cancelButton,
            isDisabled && styles.disabledButton,
            buttons.length > 1 && styles.multiButton,
            { borderColor: typeConfig.borderColor },
          ]}
          onPress={() => handleButtonPress(button)}
          activeOpacity={isDisabled ? 1 : 0.8}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel={button.text}
          accessibilityState={{ disabled: isDisabled }}
        >
          <View style={styles.buttonContent}>
            {button.icon && (
              <Ionicons
                name={button.icon as any}
                size={18}
                color={
                  isDisabled 
                    ? '#999' 
                    : isPrimary 
                      ? '#FFFFFF' 
                      : typeConfig.borderColor
                }
                style={styles.buttonIcon}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                isPrimary && styles.primaryButtonText,
                isDestructive && styles.destructiveButtonText,
                isCancel && styles.cancelButtonText,
                isDisabled && styles.disabledButtonText,
                !isPrimary && !isDisabled && { color: typeConfig.borderColor },
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
      onRequestClose={persistent ? undefined : handleDismiss}
      statusBarTranslucent
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <StatusBar backgroundColor={`rgba(0, 0, 0, ${backdropOpacity})`} barStyle="light-content" />
      
      <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.blurContainer}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
              backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={persistent ? undefined : handleDismiss}
            disabled={persistent}
          />
          
          <Animated.View
            style={[
              styles.alertContainer,
              customStyle,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: animationType === 'bounce' ? scaleAnim : pulseAnim },
                  { translateY: animationType === 'slide' ? slideAnim : 0 },
                  { translateX: shakeAnim },
                  { rotate: type === 'celebration' ? rotateInterpolation : '0deg' },
                ],
                shadowColor: typeConfig.shadowColor,
                shadowOpacity: glowInterpolation,
              },
            ]}
          >
            {/* Header avec gradient amélioré */}
            <LinearGradient
              colors={typeConfig.colors}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Effet de brillance animé */}
              <Animated.View 
                style={[
                  styles.shineEffect,
                  {
                    opacity: glowAnim,
                    transform: [
                      {
                        translateX: glowAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-100, 100],
                        }),
                      },
                    ],
                  },
                ]} 
              />
              
              <View style={[styles.iconContainer, { borderColor: typeConfig.accentColor }]}>
                <Ionicons
                  name={typeConfig.icon as any}
                  size={40}
                  color={typeConfig.iconColor}
                />
              </View>
              
              {/* Particules flottantes pour premium */}
              {type === 'premium' && (
                <View style={styles.particlesContainer}>
                  {[...Array(6)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.particle,
                        {
                          opacity: glowAnim,
                          transform: [
                            {
                              translateY: glowAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, -20],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </LinearGradient>

            {/* Contenu principal */}
            <View style={[styles.content, { backgroundColor: typeConfig.backgroundColor }]}>
              {showCloseButton && !persistent && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleDismiss}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer"
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}

              <View style={styles.textContainer}>
                <Text 
                  style={[styles.title, { color: typeConfig.borderColor }]}
                  accessibilityRole="header"
                >
                  {title}
                </Text>
                {message && (
                  <Text style={styles.message} accessibilityRole="text">
                    {message}
                  </Text>
                )}
              </View>

              {/* Ligne de séparation élégante */}
              <LinearGradient
                colors={[
                  'transparent',
                  typeConfig.borderColor + '30',
                  typeConfig.borderColor + '60',
                  typeConfig.borderColor + '30',
                  'transparent'
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.separator}
              />

              {/* Boutons d'action */}
              <View style={[
                styles.buttonContainer,
                buttons.length > 1 && styles.multiButtonContainer
              ]}>
                {renderButtons()}
              </View>
            </View>

            {/* Indicateur de priorité critique */}
            {priority === 'critical' && (
              <Animated.View 
                style={[
                  styles.priorityIndicator, 
                  { 
                    backgroundColor: typeConfig.borderColor,
                    opacity: pulseAnim,
                  }
                ]} 
              />
            )}

            {/* Badge premium */}
            {type === 'premium' && (
              <View style={[styles.premiumBadge, { backgroundColor: typeConfig.accentColor }]}>
                <Ionicons name="diamond" size={12} color="#FFFFFF" />
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
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
    width: Math.min(width * 0.9, 420),
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: {
        elevation: 30,
      },
    }),
  },
  headerGradient: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 2,
  },
  shineEffect: {
    position: 'absolute',
    top: -30,
    width: 60,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ rotate: '25deg' }],
    zIndex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    padding: 28,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  textContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  separator: {
    height: 2,
    marginBottom: 24,
    borderRadius: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  multiButtonContainer: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  multiButton: {
    marginBottom: 16,
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
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: 0.3,
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
  disabledButtonText: {
    color: '#9CA3AF',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  premiumBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
    letterSpacing: 1,
  },
});

export default CustomAlert;
