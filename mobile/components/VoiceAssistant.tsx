import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Alert } from 'react-native'
import { IconButton, Portal, Modal, Text, Button } from 'react-native-paper'
import * as Speech from 'expo-speech'
import { Audio } from 'expo-av'
import { useNetwork } from '../contexts/NetworkContext'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../types/navigation'

interface VoiceAssistantProps {
  navigation?: NativeStackNavigationProp<RootStackParamList>
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ navigation }) => {
  const [isListening, setIsListening] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [lastCommand, setLastCommand] = useState<string>('')
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const { isConnected } = useNetwork()

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync()
      }
    }
  }, [recording])

  const startListening = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync()
      if (permission.status !== 'granted') {
        Alert.alert('Permission requise', 'L\'accès au microphone est nécessaire pour l\'assistant vocal.')
        return
      }

      setIsListening(true)
      setIsVisible(true)

      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        }
      }

      const newRecording = new Audio.Recording()
      await newRecording.prepareToRecordAsync(recordingOptions)
      await newRecording.startAsync()
      setRecording(newRecording)

      // Arrêter automatiquement après 10 secondes
      setTimeout(() => {
        stopListening()
      }, 10000)
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error)
      setIsListening(false)
      setIsVisible(false)
    }
  }

  const stopListening = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync()
        const uri = recording.getURI()
        setRecording(null)

        if (uri && isConnected) {
          await processVoiceCommand(uri)
        } else if (!isConnected) {
          speak('Mode hors ligne. Commandes vocales non disponibles.')
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error)
    } finally {
      setIsListening(false)
      setIsVisible(false)
    }
  }

  const processVoiceCommand = async (audioUri: string) => {
    try {
      // Simulation du traitement de la commande vocale
      // En production, ceci ferait appel à un service de reconnaissance vocale
      const mockCommands = [
        'créer une livraison',
        'voir mes livraisons',
        'aller au profil',
        'voir les notifications',
        'appeler le support'
      ]

      const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)]
      setLastCommand(randomCommand)

      await executeVoiceCommand(randomCommand)
    } catch (error) {
      console.error('Erreur lors du traitement de la commande vocale:', error)
      speak('Désolé, je n\'ai pas compris votre commande.')
    }
  }

  const executeVoiceCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase()

    try {
      if (lowerCommand.includes('créer') && lowerCommand.includes('livraison')) {
        navigation?.navigate('CreateDelivery')
        speak('Ouverture de la création de livraison.')
      } else if (lowerCommand.includes('livraison') || lowerCommand.includes('historique')) {
        navigation?.navigate('ClientMain', { screen: 'Orders' } as any)
        speak('Affichage de vos livraisons.')
      } else if (lowerCommand.includes('profil')) {
        navigation?.navigate('ClientMain', { screen: 'Profile' } as any)
        speak('Ouverture de votre profil.')
      } else if (lowerCommand.includes('notification')) {
        navigation?.navigate('ClientMain', { screen: 'Notifications' } as any)
        speak('Affichage des notifications.')
      } else if (lowerCommand.includes('support') || lowerCommand.includes('aide')) {
        navigation?.navigate('Settings')
        speak('Ouverture du support client.')
      } else if (lowerCommand.includes('accueil') || lowerCommand.includes('home')) {
        navigation?.navigate('ClientMain', { screen: 'Home' } as any)
        speak('Retour à l\'accueil.')
      } else {
        speak('Commande non reconnue. Essayez "créer une livraison" ou "voir mes livraisons".')
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la commande:', error)
      speak('Erreur lors de l\'exécution de la commande.')
    }
  }

  const speak = (text: string) => {
    Speech.speak(text, {
      language: 'fr-FR',
      pitch: 1.0,
      rate: 0.8,
    })
  }

  const toggleModal = () => {
    setIsVisible(!isVisible)
  }

  return (
    <>
      <View style={styles.floatingButton}>
        <IconButton
          icon="microphone"
          size={24}
          iconColor="#FFFFFF"
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={isListening ? stopListening : startListening}
        />
      </View>

      <Portal>
        <Modal
          visible={isVisible}
          onDismiss={toggleModal}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assistant Vocal</Text>

            {isListening ? (
              <View style={styles.listeningContainer}>
                <Text style={styles.listeningText}>🎤 Écoute en cours...</Text>
                <Text style={styles.instructionText}>Parlez maintenant</Text>
                <Button mode="outlined" onPress={stopListening}>
                  Arrêter
                </Button>
              </View>
            ) : (
              <View style={styles.idleContainer}>
                <Text style={styles.instructionText}>
                  Appuyez sur le microphone pour commencer
                </Text>

                {lastCommand && (
                  <View style={styles.lastCommandContainer}>
                    <Text style={styles.lastCommandLabel}>Dernière commande:</Text>
                    <Text style={styles.lastCommandText}>{lastCommand}</Text>
                  </View>
                )}

                <View style={styles.examplesContainer}>
                  <Text style={styles.examplesTitle}>Exemples de commandes:</Text>
                  <Text style={styles.exampleText}>• "Créer une livraison"</Text>
                  <Text style={styles.exampleText}>• "Voir mes livraisons"</Text>
                  <Text style={styles.exampleText}>• "Aller au profil"</Text>
                  <Text style={styles.exampleText}>• "Voir les notifications"</Text>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </Portal>
    </>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 1000,
  },
  micButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  micButtonActive: {
    backgroundColor: '#FF4444',
  },
  modal: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 10,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listeningContainer: {
    alignItems: 'center',
    padding: 20,
  },
  listeningText: {
    fontSize: 18,
    marginBottom: 10,
    color: '#FF6B00',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  idleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  lastCommandContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: '100%',
  },
  lastCommandLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  lastCommandText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  examplesContainer: {
    marginTop: 20,
    width: '100%',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
})

export default VoiceAssistant