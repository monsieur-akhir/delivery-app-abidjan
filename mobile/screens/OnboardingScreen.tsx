import React, { useState, useRef } from 'react';
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
import { Button, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

const { width, height } = Dimensions.get('window');

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const onboardingData = [
    {
      title: 'Bienvenue sur Livraison Abidjan',
      description: 'Votre plateforme de livraison rapide et sécurisée en Côte d\'Ivoire',
      image: require('../assets/onboarding/welcome.png'),
      color: '#FFE8D6',
    },
    {
      title: 'Livraisons Rapides',
      description: 'Recevez vos colis en un temps record grâce à notre réseau de coursiers',
      image: require('../assets/onboarding/earnings.png'),
      color: '#FFF1E6',
    },
    {
      title: 'Suivi en Temps Réel',
      description: 'Suivez vos livraisons en direct et recevez des notifications à chaque étape',
      image: require('../assets/onboarding/tracking.png'),
      color: '#E8F0FF',
    },
    {
      title: 'Prêt à Commencer?',
      description: 'Créez un compte ou connectez-vous pour profiter de tous nos services de livraison',
      image: require('../assets/onboarding/get-started.png'),
      color: '#E6FFE8',
    },
  ];

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Change page
        const nextPage = currentPage + 1;
        scrollViewRef.current?.scrollTo({
          x: nextPage * width,
          animated: false,
        });
        setCurrentPage(nextPage);
        
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = () => {
    navigation.replace('Login');
  };

  const renderPage = (page: typeof onboardingData[0], index: number) => (
    <Animated.View 
      key={index} 
      style={[
        styles.page,
        { backgroundColor: page.color, opacity: index === currentPage ? fadeAnim : 1 }
      ]}
    >
      <Animatable.View 
        animation={index === currentPage ? "fadeInUp" : undefined}
        duration={800}
        delay={300}
        style={styles.imageContainer}
      >
        <Image source={page.image} style={styles.image} resizeMode="contain" />
      </Animatable.View>
      
      <Animatable.View 
        animation={index === currentPage ? "fadeInUp" : undefined}
        duration={800}
        delay={500}
        style={styles.content}
      >
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.description}>{page.description}</Text>
      </Animatable.View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />
      
      {/* Logo Header */}
      <View style={styles.header}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
      
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
        {onboardingData.map(renderPage)}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                scrollViewRef.current?.scrollTo({
                  x: index * width,
                  animated: true,
                });
                setCurrentPage(index);
              }}
            >
              <View
                style={[
                  styles.paginationDot,
                  currentPage === index ? styles.activeDot : {},
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentPage < onboardingData.length - 1 ? (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipButton}>Passer</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 50 }} />
          )}

          <Button
            mode="contained"
            onPress={handleNext}
            style={styles.nextButton}
            labelStyle={styles.nextButtonLabel}
          >
            {currentPage === onboardingData.length - 1 ? 'Commencer' : 'Suivant'}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FF6B00',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  logo: {
    width: 80,
    height: 40,
    tintColor: 'white',
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  page: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '110%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#FF6B00',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#757575',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
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
    backgroundColor: '#E0E0E0',
    marginHorizontal: 5,
  },
  activeDot: {
    width: 30,
    backgroundColor: '#FF6B00',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    fontSize: 16,
    color: '#757575',
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 50,
    paddingHorizontal: 20,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  nextButtonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
