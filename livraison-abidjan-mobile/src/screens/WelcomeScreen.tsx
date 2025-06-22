
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const welcomeData = [
    {
      title: 'Bienvenue chez\nLivraison Abidjan',
      subtitle: 'Votre partenaire de confiance',
      description: 'Nous connectons les communautés d\'Abidjan avec un service de livraison rapide, fiable et accessible à tous.',
      image: require('../assets/welcome/community.png'),
      gradient: ['#FF6B00', '#FF8F3C'],
      icon: '🚀',
    },
    {
      title: 'Notre Mission',
      subtitle: 'Transformer la livraison urbaine',
      description: 'Démocratiser l\'accès aux services de livraison en Côte d\'Ivoire tout en créant des opportunités économiques pour nos coursiers.',
      image: require('../assets/welcome/mission.png'),
      gradient: ['#4CAF50', '#66BB6A'],
      icon: '🎯',
    },
    {
      title: 'Nos Valeurs',
      subtitle: 'Excellence • Confiance • Innovation',
      description: 'Nous croyons en la force de la communauté, l\'innovation technologique et l\'excellence du service pour tous.',
      image: require('../assets/welcome/values.png'),
      gradient: ['#2196F3', '#42A5F5'],
      icon: '⭐',
    },
    {
      title: 'Rejoignez-nous',
      subtitle: 'Ensemble, construisons l\'avenir',
      description: 'Que vous soyez client ou coursier, vous faites partie de notre famille Livraison Abidjan.',
      image: require('../assets/welcome/join.png'),
      gradient: ['#9C27B0', '#BA68C8'],
      icon: '🤝',
    },
  ];

  const handleNext = () => {
    if (currentPage < welcomeData.length - 1) {
      const nextPage = currentPage + 1;
      scrollViewRef.current?.scrollTo({
        x: nextPage * width,
        animated: true,
      });
      setCurrentPage(nextPage);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const renderPage = (page: typeof welcomeData[0], index: number) => (
    <View key={index} style={[styles.page, { width }]}>
      <LinearGradient
        colors={page.gradient}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header avec logo */}
          <Animatable.View 
            animation="fadeInDown" 
            delay={300}
            style={styles.header}
          >
            <Image 
              source={require('../assets/logo-new.png')} 
              style={styles.logo} 
              resizeMode="contain" 
            />
          </Animatable.View>

          {/* Contenu principal */}
          <View style={styles.content}>
            {/* Icône de la page */}
            <Animatable.View
              animation="bounceIn"
              delay={500}
              style={styles.iconContainer}
            >
              <Text style={styles.pageIcon}>{page.icon}</Text>
            </Animatable.View>

            {/* Image illustrative */}
            <Animatable.View
              animation="fadeInUp"
              delay={700}
              style={styles.imageContainer}
            >
              <Image 
                source={page.image} 
                style={styles.illustration}
                resizeMode="contain"
              />
            </Animatable.View>

            {/* Texte */}
            <Animatable.View
              animation="fadeInUp"
              delay={900}
              style={styles.textContainer}
            >
              <Text style={styles.title}>{page.title}</Text>
              <Text style={styles.subtitle}>{page.subtitle}</Text>
              <Text style={styles.description}>{page.description}</Text>
            </Animatable.View>
          </View>

          {/* Navigation */}
          <Animatable.View
            animation="fadeInUp"
            delay={1100}
            style={styles.navigation}
          >
            <View style={styles.pagination}>
              {welcomeData.map((_, pIndex) => (
                <TouchableOpacity
                  key={pIndex}
                  onPress={() => {
                    scrollViewRef.current?.scrollTo({
                      x: pIndex * width,
                      animated: true,
                    });
                    setCurrentPage(pIndex);
                  }}
                  style={[
                    styles.paginationDot,
                    currentPage === pIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>

            <View style={styles.buttonContainer}>
              {currentPage < welcomeData.length - 1 ? (
                <>
                  <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                    <Text style={styles.skipText}>Passer</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
                      style={styles.nextButtonGradient}
                    >
                      <Text style={styles.nextText}>Suivant</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity onPress={handleNext} style={styles.startButton}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
                    style={styles.startButtonGradient}
                  >
                    <Text style={styles.startText}>Commencer l'aventure</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </Animatable.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="transparent" translucent barStyle="light-content" />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        onMomentumScrollEnd={(event) => {
          const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(pageIndex);
        }}
        contentContainerStyle={styles.scrollContainer}
      >
        {welcomeData.map(renderPage)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  page: {
    flex: 1,
    height,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingVertical: 20,
  },
  logo: {
    width: 120,
    height: 60,
    tintColor: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  pageIcon: {
    fontSize: 60,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  illustration: {
    width: '80%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  navigation: {
    paddingBottom: 30,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 5,
  },
  activeDot: {
    width: 30,
    backgroundColor: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  nextButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  nextText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  startButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  startText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
});

export default WelcomeScreen;
