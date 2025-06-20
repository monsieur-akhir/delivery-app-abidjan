import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const { width } = Dimensions.get('window');

export interface ToastAction {
  label: string;
  onPress: () => void;
  icon?: string;
}

export interface CustomToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'payment' | 'delivery';
  duration?: number;
  onDismiss?: () => void;
  action?: ToastAction;
  icon?: string;
  title?: string;
  position?: 'top' | 'bottom';
  swipeable?: boolean;
}

const CustomToast: React.FC<CustomToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  action,
  icon,
  title,
  position = 'top',
  swipeable = true,
}) => {
  const translateY = useRef(new Animated.Value(-200)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Feedback haptique selon le type
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animation d'entrée
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: position === 'top' ? -200 : 200,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (Math.abs(translationX) > 100) {
        // Swipe pour dismisser
        Animated.timing(translateX, {
          toValue: translationX > 0 ? width : -width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          handleDismiss();
        });
      } else {
        // Retour à la position initiale
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#4CAF50', '#45A049'] as const,
          icon: icon || 'checkmark-circle',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'error':
        return {
          colors: ['#F44336', '#D32F2F'] as const,
          icon: icon || 'close-circle',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#F57C00'] as const,
          icon: icon || 'warning',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'payment':
        return {
          colors: ['#9C27B0', '#7B1FA2'] as const,
          icon: icon || 'card',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      case 'delivery':
        return {
          colors: ['#00BCD4', '#0097A7'] as const,
          icon: icon || 'bicycle',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
      default:
        return {
          colors: ['#2196F3', '#1976D2'] as const,
          icon: icon || 'information-circle',
          iconColor: '#FFFFFF',
          textColor: '#FFFFFF',
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: position === 'top' ? insets.top + 16 : undefined,
          bottom: position === 'bottom' ? insets.bottom + 16 : undefined,
          opacity,
          transform: [
            { translateY },
            { translateX },
            { scale },
          ],
        },
      ]}
    >
      <PanGestureHandler
        enabled={swipeable}
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View>
          <LinearGradient
            colors={typeConfig.colors}
            style={styles.toast}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Icône */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={typeConfig.icon as any}
                size={24}
                color={typeConfig.iconColor}
              />
            </View>

            {/* Contenu */}
            <View style={styles.content}>
              {title && (
                <Text style={[styles.title, { color: typeConfig.textColor }]}>
                  {title}
                </Text>
              )}
              <Text style={[styles.message, { color: typeConfig.textColor }]}>
                {message}
              </Text>
            </View>

            {/* Action ou bouton de fermeture */}
            <View style={styles.actionContainer}>
              {action ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    action.onPress();
                  }}
                  activeOpacity={0.8}
                >
                  {action.icon && (
                    <Ionicons
                      name={action.icon as any}
                      size={16}
                      color={typeConfig.textColor}
                      style={styles.actionIcon}
                    />
                  )}
                  <Text style={[styles.actionText, { color: typeConfig.textColor }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleDismiss}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={18} color={typeConfig.textColor} />
                </TouchableOpacity>
              )}
            </View>

            {/* Indicateur de progression */}
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
              ]}
            />
          </LinearGradient>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    minHeight: 64,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  actionContainer: {
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});

export default CustomToast;
