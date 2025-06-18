import React, { useEffect, useRef, useState } from 'react';
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

const { width, height } = Dimensions.get('window');

export interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  icon?: string;
  title?: string;
}

const CustomToast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 4000,
  onDismiss,
  action,
  icon,
  title,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      
      // Feedback haptique
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animation d'entrée
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
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
      ]).start();

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      dismissToast();
    }
  }, [visible, duration]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#4CAF50', '#45A049'],
          icon: icon || 'checkmark-circle',
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          textColor: '#2E7D32',
        };
      case 'error':
        return {
          colors: ['#F44336', '#D32F2F'],
          icon: icon || 'close-circle',
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          textColor: '#C62828',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#F57C00'],
          icon: icon || 'warning',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          textColor: '#E65100',
        };
      default:
        return {
          colors: ['#2196F3', '#1976D2'],
          icon: icon || 'information-circle',
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          textColor: '#1565C0',
        };
    }
  };

  const typeConfig = getTypeConfig();

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <LinearGradient
        colors={Array.isArray(typeConfig.colors) ? typeConfig.colors : [typeConfig.colors] as [string]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={typeConfig.icon as any}
            size={24}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: typeConfig.backgroundColor }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={dismissToast}
        >
          <Ionicons name="close" size={18} color={typeConfig.textColor} />
        </TouchableOpacity>

        <View style={[styles.textContainer, { marginRight: action && action.label ? 80 : 0 }]}>
          {title && (
            <Text style={[styles.title, { color: typeConfig.textColor }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.message, { color: typeConfig.textColor }]}>
            {message}
          </Text>
        </View>

        {action && action.label && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: typeConfig.borderColor }]}
            onPress={action.onPress}
          >
            <Text style={[styles.actionText, { color: typeConfig.textColor }]}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  headerGradient: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomToast; 