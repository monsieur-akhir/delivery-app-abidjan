
import React from 'react';
import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomLoaderModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  type?: 'loading' | 'success' | 'error';
  onDismiss?: () => void;
}

const { width, height } = Dimensions.get('window');

const CustomLoaderModal: React.FC<CustomLoaderModalProps> = ({
  visible,
  title = 'Chargement...',
  message = 'Veuillez patienter',
  type = 'loading',
  onDismiss,
}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Animation d'entrée
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
      ]).start();

      // Animation de rotation continue pour le loader
      if (type === 'loading') {
        const startSpinning = () => {
          spinValue.setValue(0);
          Animated.timing(spinValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start(() => startSpinning());
        };
        startSpinning();
      }
    } else {
      // Animation de sortie
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, type]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#4CAF50' };
      case 'error':
        return { icon: 'close-circle', color: '#F44336' };
      default:
        return { icon: 'hourglass', color: '#2196F3' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <View style={styles.content}>
            {type === 'loading' ? (
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                <ActivityIndicator size="large" color={color} />
              </Animated.View>
            ) : (
              <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={48} color={color} />
              </View>
            )}

            <Text style={[styles.title, { color }]}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {type === 'loading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: color,
                        transform: [{ scaleX: scaleValue }],
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: width * 0.7,
    maxWidth: width * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default CustomLoaderModal;
