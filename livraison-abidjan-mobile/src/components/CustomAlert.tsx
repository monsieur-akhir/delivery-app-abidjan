import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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
  PanResponder,
  BackHandler,
  AccessibilityInfo,
  InteractionManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Types améliorés avec plus de flexibilité
export interface AlertButton {
  id?: string;
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive' | 'primary' | 'secondary';
  isPrimary?: boolean;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  color?: string;
  backgroundColor?: string;
}

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirmation' | 'payment' | 'location' | 'premium' | 'celebration' | 'custom';
  icon?: string;
  onDismiss?: () => void;
  showCloseButton?: boolean;
  autoDismiss?: boolean;
  dismissAfter?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  soundEnabled?: boolean;
  customStyle?: object;
  animationType?: 'fade' | 'slide' | 'bounce' | 'pulse' | 'zoom' | 'slideUp';
  backdropOpacity?: number;
  persistent?: boolean;
  swipeToClose?: boolean;
  customColors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  maxWidth?: number;
  position?: 'center' | 'top' | 'bottom';
  showProgress?: boolean;
  progressValue?: number;
  richContent?: React.ReactNode;
  onShow?: () => void;
  onHide?: () => void;
  testID?: string;
  reducedMotion?: boolean;
  darkMode?: boolean;
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
  swipeToClose = true,
  customColors,
  maxWidth = 420,
  position = 'center',
  showProgress = false,
  progressValue = 0,
  richContent,
  onShow,
  onHide,
  testID = 'custom-alert',
  reducedMotion = false,
  darkMode = false,
}) => {
  const insets = useSafeAreaInsets();
  
  // Animations optimisées avec useRef
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(position === 'top' ? -200 : position === 'bottom' ? 200 : -100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  
  // État pour le loading des boutons
  const [buttonLoadingStates, setButtonLoadingStates] = React.useState<Record<string, boolean>>({});
  
  // Timer refs pour le nettoyage
  const autoDismissTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const hapticTimer = useRef<NodeJS.Timeout | undefined>(undefined);

  // Configuration des types avec support du mode sombre
  const getTypeConfig = useMemo(() => {
    const configs = {
      success: {
        colors: darkMode 
          ? ['#22C55E', '#16A34A', '#15803D', '#166534'] as const
          : ['#4CAF50', '#45A049', '#388E3C', '#2E7D32'] as const,
        icon: icon || 'checkmark-circle',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#064E3B' : '#E8F5E8',
        borderColor: darkMode ? '#22C55E' : '#4CAF50',
        shadowColor: darkMode ? '#22C55E' : '#4CAF50',
        accentColor: darkMode ? '#34D399' : '#66BB6A',
      },
      celebration: {
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'] as const,
        icon: icon || 'trophy',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#7C2D12' : '#FFF3E0',
        borderColor: '#FF6B6B',
        shadowColor: '#FF6B6B',
        accentColor: '#FFB74D',
      },
      warning: {
        colors: darkMode 
          ? ['#F59E0B', '#D97706', '#B45309', '#92400E'] as const
          : ['#FF9800', '#F57C00', '#E65100', '#BF360C'] as const,
        icon: icon || 'warning',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#78350F' : '#FFF3E0',
        borderColor: darkMode ? '#F59E0B' : '#FF9800',
        shadowColor: darkMode ? '#F59E0B' : '#FF9800',
        accentColor: darkMode ? '#FBBF24' : '#FFB74D',
      },
      error: {
        colors: darkMode 
          ? ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'] as const
          : ['#F44336', '#D32F2F', '#B71C1C', '#8E0000'] as const,
        icon: icon || 'close-circle',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#7F1D1D' : '#FFEBEE',
        borderColor: darkMode ? '#EF4444' : '#F44336',
        shadowColor: darkMode ? '#EF4444' : '#F44336',
        accentColor: darkMode ? '#F87171' : '#E57373',
      },
      payment: {
        colors: darkMode 
          ? ['#A855F7', '#9333EA', '#7C3AED', '#6D28D9'] as const
          : ['#9C27B0', '#7B1FA2', '#4A148C', '#1A0033'] as const,
        icon: icon || 'card',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#581C87' : '#F3E5F5',
        borderColor: darkMode ? '#A855F7' : '#9C27B0',
        shadowColor: darkMode ? '#A855F7' : '#9C27B0',
        accentColor: darkMode ? '#C084FC' : '#BA68C8',
      },
      location: {
        colors: darkMode 
          ? ['#06B6D4', '#0891B2', '#0E7490', '#155E75'] as const
          : ['#00BCD4', '#0097A7', '#006064', '#00251A'] as const,
        icon: icon || 'location',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#164E63' : '#E0F2F1',
        borderColor: darkMode ? '#06B6D4' : '#00BCD4',
        shadowColor: darkMode ? '#06B6D4' : '#00BCD4',
        accentColor: darkMode ? '#22D3EE' : '#4DD0E1',
      },
      premium: {
        colors: darkMode 
          ? ['#FBBF24', '#F59E0B', '#D97706', '#B45309'] as const
          : ['#FFD700', '#FFA000', '#FF8F00', '#FF6F00'] as const,
        icon: icon || 'star',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#78350F' : '#FFFDE7',
        borderColor: darkMode ? '#FBBF24' : '#FFD700',
        shadowColor: darkMode ? '#FBBF24' : '#FFD700',
        accentColor: darkMode ? '#FCD34D' : '#FFEB3B',
      },
      confirmation: {
        colors: darkMode 
          ? ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF'] as const
          : ['#2196F3', '#1976D2', '#0D47A1', '#002171'] as const,
        icon: icon || 'help-circle',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#1E3A8A' : '#E3F2FD',
        borderColor: darkMode ? '#3B82F6' : '#2196F3',
        shadowColor: darkMode ? '#3B82F6' : '#2196F3',
        accentColor: darkMode ? '#60A5FA' : '#64B5F6',
      },
      custom: customColors ? {
        colors: [customColors.primary, customColors.secondary, customColors.primary, customColors.secondary] as const,
        icon: icon || 'information-circle',
        iconColor: '#FFFFFF',
        backgroundColor: customColors.background,
        borderColor: customColors.primary,
        shadowColor: customColors.primary,
        accentColor: customColors.secondary,
      } : {
        colors: ['#607D8B', '#455A64', '#263238', '#000A12'] as const,
        icon: icon || 'information-circle',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#334155' : '#ECEFF1',
        borderColor: darkMode ? '#64748B' : '#607D8B',
        shadowColor: darkMode ? '#64748B' : '#607D8B',
        accentColor: darkMode ? '#94A3B8' : '#90A4AE',
      },
      info: {
        colors: darkMode 
          ? ['#64748B', '#475569', '#334155', '#1E293B'] as const
          : ['#607D8B', '#455A64', '#263238', '#000A12'] as const,
        icon: icon || 'information-circle',
        iconColor: '#FFFFFF',
        backgroundColor: darkMode ? '#334155' : '#ECEFF1',
        borderColor: darkMode ? '#64748B' : '#607D8B',
        shadowColor: darkMode ? '#64748B' : '#607D8B',
        accentColor: darkMode ? '#94A3B8' : '#90A4AE',
      },
    };
    
    return configs[type] || configs.info;
  }, [type, darkMode, customColors, icon]);

  // Gestionnaire de swipe amélioré
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return swipeToClose && Math.abs(gestureState.dy) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (swipeToClose) {
        swipeAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (swipeToClose) {
        if (Math.abs(gestureState.dy) > 100 || Math.abs(gestureState.vy) > 0.5) {
          handleDismiss();
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      }
    },
  }), [swipeToClose]);

  // Animations optimisées avec InteractionManager
  const getEntranceAnimation = useCallback(() => {
    const duration = reducedMotion ? 200 : 300;
    const springConfig = {
      tension: reducedMotion ? 200 : 120,
      friction: reducedMotion ? 12 : 8,
      useNativeDriver: true,
    };

    switch (animationType) {
      case 'slide':
      case 'slideUp':
        return Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            ...springConfig,
          }),
        ]);
      case 'zoom':
        return Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            ...springConfig,
          }),
        ]);
      case 'pulse':
        return Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: duration * 0.7,
            useNativeDriver: true,
          }),
          reducedMotion ? Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }) :
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
            duration,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            ...springConfig,
          }),
        ]);
    }
  }, [animationType, reducedMotion, fadeAnim, slideAnim, scaleAnim, pulseAnim]);

  // Gestion des effets avec nettoyage approprié
  useEffect(() => {
    if (visible) {
      // Callback onShow
      onShow?.();
      
      // Feedback haptique intelligent avec throttling
      if (soundEnabled && !hapticTimer.current) {
        hapticTimer.current = setTimeout(() => {
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
          hapticTimer.current = undefined;
        }, 100);
      }

      // Animation d'entrée avec InteractionManager pour de meilleures performances
      InteractionManager.runAfterInteractions(() => {
        getEntranceAnimation().start();
      });

      // Animation de brillance continue (seulement si pas de mouvement réduit)
      if (!reducedMotion) {
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
      }

      // Animation spéciale pour les erreurs critiques
      if (type === 'error' && priority === 'critical' && !reducedMotion) {
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();
      }

      // Animation de célébration
      if (type === 'celebration' && !reducedMotion) {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      }

      // Auto-dismiss intelligent avec nettoyage
      if (autoDismiss) {
        autoDismissTimer.current = setTimeout(() => {
          handleDismiss();
        }, dismissAfter);
      }

      // Gestion du bouton retour Android
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!persistent) {
          handleDismiss();
          return true;
        }
        return false;
      });

      // Annonce pour l'accessibilité
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(`Alerte: ${title}${message ? `, ${message}` : ''}`);
      }

      return () => {
        backHandler.remove();
      };
    } else {
      // Animation de sortie fluide
      const exitDuration = reducedMotion ? 150 : 250;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.3,
          duration: exitDuration,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: position === 'top' ? -200 : position === 'bottom' ? 200 : -100,
          duration: exitDuration,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide?.();
      });
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
      if (hapticTimer.current) {
        clearTimeout(hapticTimer.current);
      }
    };
  }, [visible, type, priority, animationType, autoDismiss, dismissAfter, reducedMotion]);

  // Animation de progression
  useEffect(() => {
    if (showProgress) {
      Animated.timing(progressAnim, {
        toValue: progressValue,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [showProgress, progressValue]);

  const handleDismiss = useCallback(() => {
    if (persistent) return;
    
    if (soundEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onDismiss?.();
  }, [persistent, soundEnabled, onDismiss]);

  const handleButtonPress = useCallback(async (button: AlertButton, index: number) => {
    if (button.disabled || buttonLoadingStates[button.id || index.toString()]) return;

    // Feedback haptique contextuel
    if (soundEnabled) {
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
    }

    const buttonId = button.id || index.toString();
    
    try {
      // Gérer le loading state
      if (button.loading !== false) {
        setButtonLoadingStates(prev => ({ ...prev, [buttonId]: true }));
      }

      if (button.onPress) {
        await button.onPress();
      }
      
      handleDismiss();
    } catch (error) {
      console.error('Error in button press handler:', error);
    } finally {
      setButtonLoadingStates(prev => ({ ...prev, [buttonId]: false }));
    }
  }, [buttonLoadingStates, soundEnabled, handleDismiss]);

  // Memoization des interpolations coûteuses
  const animationValues = useMemo(() => ({
    rotateInterpolation: rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),
    glowInterpolation: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
    }),
    progressInterpolation: progressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    }),
  }), [rotateAnim, glowAnim, progressAnim]);

  // Ajout d'un bouton "Fermer" par défaut si aucun bouton n'est fourni
  const effectiveButtons = useMemo(() => {
    if (buttons && buttons.length > 0) return buttons;
    return [
      {
        text: 'Fermer',
        onPress: onDismiss,
        style: 'primary',
        isPrimary: true,
        icon: type === 'error' ? 'close' : type === 'success' ? 'checkmark' : 'close',
        accessibilityLabel: 'Fermer l\'alerte',
      },
    ];
  }, [buttons, onDismiss, type]);

  const renderButtons = useCallback(() => {
    if (effectiveButtons.length === 0) {
      return (
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            { backgroundColor: getTypeConfig.borderColor }
          ]}
          onPress={handleDismiss}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="OK"
          testID={`${testID}-ok-button`}
        >
          <Text style={styles.primaryButtonText}>OK</Text>
        </TouchableOpacity>
      );
    }

    return effectiveButtons.map((button, index) => {
      const isPrimary = button.isPrimary || button.style === 'primary';
      const isDestructive = button.style === 'destructive';
      const isCancel = button.style === 'cancel';
      const isSecondary = button.style === 'secondary';
      const isDisabled = button.disabled;
      const isLoading = buttonLoadingStates[button.id || index.toString()];

      return (
        <TouchableOpacity
          key={button.id || index}
          style={[
            styles.button,
            isPrimary && [styles.primaryButton, { backgroundColor: button.backgroundColor || getTypeConfig.borderColor }],
            isDestructive && styles.destructiveButton,
            isCancel && styles.cancelButton,
            isSecondary && styles.secondaryButton,
            isDisabled && styles.disabledButton,
            effectiveButtons.length > 1 && styles.multiButton,
            { borderColor: button.color || getTypeConfig.borderColor },
            darkMode && styles.darkButton,
          ]}
          onPress={() => handleButtonPress(button, index)}
          activeOpacity={isDisabled || isLoading ? 1 : 0.8}
          disabled={isDisabled || isLoading}
          accessibilityRole="button"
          accessibilityLabel={button.accessibilityLabel || button.text}
          accessibilityState={{ disabled: isDisabled || isLoading }}
          testID={button.testID || `${testID}-button-${index}`}
        >
          <View style={styles.buttonContent}>
            {(button.icon || isLoading) && (
              <Ionicons
                name={isLoading ? 'hourglass' : (button.icon as any)}
                size={18}
                color={
                  isDisabled 
                    ? '#999' 
                    : isPrimary 
                      ? '#FFFFFF' 
                      : button.color || getTypeConfig.borderColor
                }
                style={[styles.buttonIcon, isLoading && { opacity: 0.7 }]}
              />
            )}
            <Text
              style={[
                styles.buttonText,
                isPrimary && styles.primaryButtonText,
                isDestructive && styles.destructiveButtonText,
                isCancel && styles.cancelButtonText,
                isSecondary && styles.secondaryButtonText,
                isDisabled && styles.disabledButtonText,
                !isPrimary && !isDisabled && { color: button.color || getTypeConfig.borderColor },
                darkMode && styles.darkButtonText,
              ]}
            >
              {button.text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  }, [effectiveButtons, getTypeConfig, buttonLoadingStates, handleButtonPress, handleDismiss, darkMode, testID]);

  const getPositionStyle = (): import('react-native').ViewStyle => {
    switch (position) {
      case 'top':
        return { justifyContent: 'flex-start', paddingTop: insets.top + 50 };
      case 'bottom':
        return { justifyContent: 'flex-end', paddingBottom: insets.bottom + 50 };
      default:
        return { justifyContent: 'center' };
    }
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
      testID={testID}
    >
      <StatusBar 
        backgroundColor={`rgba(0, 0, 0, ${backdropOpacity})`} 
        barStyle={darkMode ? "light-content" : "dark-content"} 
      />
      
      <BlurView intensity={Platform.OS === 'ios' ? 100 : 80} style={styles.blurContainer}>
        <Animated.View
          style={[
            styles.overlay,
            getPositionStyle() as import('react-native').ViewStyle,
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
            testID={`${testID}-backdrop`}
          />
          
          <Animated.View
            {...(swipeToClose ? panResponder.panHandlers : {})}
            style={[
              styles.alertContainer,
              customStyle,
              {
                maxWidth: Math.min(width * 0.9, maxWidth),
                opacity: fadeAnim,
                transform: [
                  { scale: animationType === 'bounce' || animationType === 'zoom' ? scaleAnim : pulseAnim },
                  { translateY: animationType === 'slide' || animationType === 'slideUp' ? slideAnim : swipeAnim },
                  { translateX: shakeAnim },
                  { rotate: type === 'celebration' ? animationValues.rotateInterpolation : '0deg' },
                ],
                shadowColor: getTypeConfig.shadowColor,
                shadowOpacity: animationValues.glowInterpolation,
                backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
              },
            ]}
            testID={`${testID}-container`}
          >
            {/* Header avec gradient amélioré */}
            <LinearGradient
              colors={getTypeConfig.colors}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Effet de brillance animé */}
              {!reducedMotion && (
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
              )}
              
              <View style={[styles.iconContainer, { borderColor: getTypeConfig.accentColor }]}>
                <Ionicons
                  name={getTypeConfig.icon as any}
                  size={40}
                  color={getTypeConfig.iconColor}
                />
              </View>
              
              {/* Particules flottantes pour premium */}
              {type === 'premium' && !reducedMotion && (
                <View style={styles.particlesContainer}>
                  {[...Array(6)].map((_, i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.particle,
                        {
                          left: `${15 + i * 12}%`,
                          top: `${20 + (i % 2) * 40}%`,
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

            {/* Barre de progression */}
            {showProgress && (
              <View style={styles.progressContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: animationValues.progressInterpolation,
                      backgroundColor: getTypeConfig.borderColor,
                    },
                  ]}
                />
              </View>
            )}

            {/* Contenu principal */}
            <View style={[
              styles.content,
              { backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }
            ]}>
              {/* Bouton de fermeture */}
              {showCloseButton && !persistent && (
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { 
                      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
                    }
                  ]}
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Fermer l'alerte"
                  testID={`${testID}-close-button`}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color={darkMode ? '#9CA3AF' : '#6B7280'}
                  />
                </TouchableOpacity>
              )}

              {/* Titre */}
              <Text
                style={[
                  styles.title,
                  {
                    color: customColors?.text || (darkMode ? '#F9FAFB' : '#1F2937'),
                    textAlign: 'center',
                  }
                ]}
                accessibilityRole="header"
                testID={`${testID}-title`}
              >
                {title}
              </Text>

              {/* Message */}
              {message && (
                <Text
                  style={[
                    styles.message,
                    {
                      color: customColors?.text || (darkMode ? '#D1D5DB' : '#4B5563'),
                      textAlign: 'center',
                    }
                  ]}
                  testID={`${testID}-message`}
                >
                  {message}
                </Text>
              )}

              {/* Contenu riche personnalisé */}
              {richContent && (
                <View style={styles.richContentContainer}>
                  {richContent}
                </View>
              )}

              {/* Indicateur de priorité */}
              {priority === 'critical' && (
                <View style={[
                  styles.priorityBadge,
                  { 
                    backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: darkMode ? '#EF4444' : '#F87171'
                  }
                ]}>
                  <Ionicons
                    name="alert-circle"
                    size={16}
                    color={darkMode ? '#EF4444' : '#DC2626'}
                  />
                  <Text style={[
                    styles.priorityText,
                    { color: darkMode ? '#EF4444' : '#DC2626' }
                  ]}>
                    Critique
                  </Text>
                </View>
              )}

              {/* Séparateur */}
              {(message || richContent || priority === 'critical') && effectiveButtons.length > 0 && (
                <View style={[
                  styles.separator,
                  { backgroundColor: darkMode ? '#374151' : '#E5E7EB' }
                ]} />
              )}

              {/* Zone des boutons */}
              <View style={[
                styles.buttonContainer,
                effectiveButtons.length > 2 && styles.verticalButtonContainer,
                effectiveButtons.length === 2 && styles.horizontalButtonContainer,
              ]}>
                {renderButtons()}
              </View>

              {/* Indicateur de swipe */}
              {swipeToClose && !persistent && (
                <View style={[
                  styles.swipeIndicator,
                  { backgroundColor: darkMode ? '#4B5563' : '#D1D5DB' }
                ]}>
                  <View style={[
                    styles.swipeHandle,
                    { backgroundColor: darkMode ? '#6B7280' : '#9CA3AF' }
                  ]} />
                </View>
              )}
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
};

// Styles complets pour le composant
const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowRadius: 20,
    shadowOpacity: 0.25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerGradient: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.3,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    opacity: 0.9,
  },
  richContentContainer: {
    marginVertical: 16,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    marginVertical: 16,
    opacity: 0.3,
  },
  buttonContainer: {
    gap: 12,
  },
  verticalButtonContainer: {
    flexDirection: 'column',
  },
  horizontalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  multiButton: {
    flex: 1,
  },
  primaryButton: {
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowOpacity: 0.2,
  },
  destructiveButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderColor: '#D1D5DB',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  darkButton: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
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
    textAlign: 'center',
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
  secondaryButtonText: {
    color: '#374151',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  darkButtonText: {
    color: '#D1D5DB',
  },
  swipeIndicator: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  swipeHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default CustomAlert;