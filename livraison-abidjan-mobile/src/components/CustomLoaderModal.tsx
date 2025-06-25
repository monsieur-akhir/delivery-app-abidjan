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
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomLoaderModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  type?: 'loading' | 'success' | 'error';
  onDismiss?: () => void;
  timeoutMs?: number;
  timeoutMessage?: string;
}

const { width, height } = Dimensions.get('window');
const BAR_WIDTH = 180; // Largeur de la barre de chargement
const BIKE_SIZE = 38;

const CustomLoaderModal: React.FC<CustomLoaderModalProps> = ({
  visible,
  title = 'Chargement...',
  message = 'Veuillez patienter',
  type = 'loading',
  onDismiss,
  timeoutMs = 30000,
  timeoutMessage = 'Le chargement prend plus de temps que prévu. Veuillez vérifier votre connexion ou réessayer.',
}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const fadeValue = React.useRef(new Animated.Value(0)).current;
  const [timedOut, setTimedOut] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const bikeAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const bounceAnim = React.useRef(new Animated.Value(0)).current;
  const [barWidthValue, setBarWidthValue] = React.useState(0);

  React.useEffect(() => {
    let progressListenerId: string | undefined;
    if (visible) {
      setTimedOut(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setTimedOut(true), timeoutMs);
      // Animation d'entrée
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 300,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 200,
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Animation de sortie
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (visible && type === 'loading') {
      progressAnim.setValue(0);
      setBarWidthValue(0);
      progressListenerId = progressAnim.addListener(({ value }) => {
        setBarWidthValue(value * BAR_WIDTH);
      });
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: timeoutMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(bikeAnim, {
            toValue: BAR_WIDTH - 40, // 40 = largeur de l'icône
            duration: 1200,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bikeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animation rebond moto
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -12,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      progressAnim.setValue(0);
      setBarWidthValue(0);
      bikeAnim.setValue(0);
      bounceAnim.setValue(0);
    }

    // Nettoyage au démontage
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressListenerId) progressAnim.removeListener(progressListenerId as string);
    };
  }, [visible, type, timeoutMs]);

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
        return { icon: 'hourglass', color: '#FF9800' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}> 
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <View style={styles.content}>
            {type === 'loading' && !timedOut ? (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack} />
                <View
                  style={[
                    styles.progressBarFill,
                    { width: barWidthValue, backgroundColor: color },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.bikeIcon,
                    { 
                      transform: [
                        { translateX: Math.max(0, barWidthValue - BIKE_SIZE / 2) },
                        { translateY: bounceAnim },
                      ],
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.25,
                      shadowRadius: 8,
                      elevation: 8,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="motorbike" size={BIKE_SIZE} color={color} />
                </Animated.View>
              </View>
            ) : null}
            {(type === 'success' || type === 'error' || timedOut) && (
              <View style={styles.iconContainer}>
                <Ionicons name={icon as any} size={48} color={color} />
              </View>
            )}

            <Text
              style={[styles.title, styles.titleUX, { color: timedOut ? '#F44336' : color }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {timedOut ? 'Temps écoulé' : title}
            </Text>
            <Text
              style={styles.messageUX}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {timedOut ? timeoutMessage : message}
            </Text>

            {type === 'loading' && !timedOut && (
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
            {timedOut && (
              <View style={{ marginTop: 18, width: '100%', alignItems: 'center' }}>
                <Text style={{ color: '#F44336', fontWeight: '600', marginBottom: 10, textAlign: 'center' }}>
                  Vous pouvez réessayer ou fermer cette fenêtre.
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                  <TouchableOpacity
                    onPress={onDismiss}
                    style={{
                      backgroundColor: '#F44336',
                      borderRadius: 8,
                      paddingVertical: 10,
                      paddingHorizontal: 24,
                      alignItems: 'center',
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}>
                      Fermer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
    minWidth: width * 0.7,
    maxWidth: width * 0.9,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: width > 400 ? 20 : 17,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleUX: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: width > 400 ? 15 : 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: width * 0.7,
  },
  messageUX: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
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
  progressBarContainer: {
    width: BAR_WIDTH,
    height: 48,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    alignSelf: 'center',
  },
  progressBarTrack: {
    position: 'absolute',
    top: 38,
    left: 0,
    right: 0,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F3F3F3',
    width: BAR_WIDTH,
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    top: 38,
    left: 0,
    height: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  bikeIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
});

export default CustomLoaderModal;
