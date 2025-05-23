"use client"

import { useState, useEffect, useRef } from "react"
import { View, TouchableOpacity, Modal, Animated, Easing, StyleSheet } from "react-native"
import { Text, IconButton, ActivityIndicator } from "react-native-paper"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import * as Speech from "expo-speech"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../contexts/NetworkContext"
import { processVoiceCommand } from "../services/api"

const VoiceAssistant = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const { isConnected } = useNetwork()

  const [isVisible, setIsVisible] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recording, setRecording] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState(null)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [error, setError] = useState("")

  const pulseAnim = useRef(new Animated.Value(1)).current

  // Animation de pulsation pour l'icône d'enregistrement
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start()
    } else {
      pulseAnim.setValue(1)
    }

    return () => {
      pulseAnim.stopAnimation()
    }
  }, [isListening, pulseAnim])

  // Nettoyer les ressources à la fermeture
  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording()
      }

      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [])

  const openAssistant = () => {
    setIsVisible(true)
    setTranscript("")
    setResponse("")
    setError("")
  }

  const closeAssistant = () => {
    if (isListening) {
      stopRecording()
    }

    setIsVisible(false)
  }

  const startListening = async () => {
    if (!isConnected) {
      setError(t("voiceAssistant.offlineError"))
      return
    }

    try {
      // Demander la permission d'enregistrer
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        setError(t("voiceAssistant.microphonePermission"))
        return
      }

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })

      // Créer un nouvel enregistrement
      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY)
      await recording.startAsync()
      setRecording(recording)
      setIsListening(true)
      setTranscript("")
      setResponse("")
      setError("")

      // Démarrer le chronomètre
      let duration = 0
      const timer = setInterval(() => {
        duration += 1
        setRecordingDuration(duration)

        // Limiter l'enregistrement à 10 secondes
        if (duration >= 10) {
          stopRecording()
        }
      }, 1000)

      setRecordingTimer(timer)
    } catch (error) {
      console.error("Error starting recording:", error)
      setError(t("voiceAssistant.recordingError"))
    }
  }

  const stopRecording = async () => {
    try {
      if (!recording) return

      // Arrêter le chronomètre
      if (recordingTimer) {
        clearInterval(recordingTimer)
        setRecordingTimer(null)
      }

      // Arrêter l'enregistrement
      setIsListening(false)
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)

      // Réinitialiser l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })

      // Traiter l'enregistrement
      processRecording(uri)
    } catch (error) {
      console.error("Error stopping recording:", error)
      setError(t("voiceAssistant.recordingError"))
      setIsListening(false)
    }
  }

  const processRecording = async (uri) => {
    try {
      setIsProcessing(true)

      // Convertir l'enregistrement en base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Envoyer l'enregistrement au serveur pour traitement
      const result = await processVoiceCommand({
        audio: base64Audio,
        language: i18n.language,
      })

      if (result && result.transcript) {
        setTranscript(result.transcript)

        if (result.response) {
          setResponse(result.response)

          // Lire la réponse à haute voix
          Speech.speak(result.response, {
            language: i18n.language,
            rate: 0.9,
          })
        }

        // Exécuter l'action si disponible
        if (result.action) {
          handleAction(result.action)
        }
      } else {
        setError(t("voiceAssistant.processingError"))
      }
    } catch (error) {
      console.error("Error processing recording:", error)
      setError(t("voiceAssistant.processingError"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAction = (action) => {
    // Fermer l'assistant après un court délai
    setTimeout(() => {
      closeAssistant()

      // Exécuter l'action en fonction du type
      switch (action.type) {
        case "create_delivery":
          navigation.navigate("CreateDelivery", action.params || {})
          break
        case "track_delivery":
          if (action.params && action.params.deliveryId) {
            navigation.navigate("TrackDelivery", action.params)
          }
          break
        case "view_marketplace":
          navigation.navigate("Marketplace")
          break
        case "view_profile":
          navigation.navigate("Profile")
          break
        case "view_notifications":
          navigation.navigate("Notifications")
          break
        default:
          // Aucune action spécifique
          break
      }
    }, 2000)
  }

  return (
    <>
      <TouchableOpacity style={styles.floatingButton} onPress={openAssistant}>
        <IconButton icon="microphone" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeAssistant}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("voiceAssistant.title")}</Text>
              <IconButton icon="close" size={24} color="#757575" onPress={closeAssistant} />
            </View>

            <View style={styles.assistantContainer}>
              {isListening ? (
                <View style={styles.listeningContainer}>
                  <Animated.View
                    style={[
                      styles.pulseCircle,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    <IconButton icon="microphone" size={40} color="#FFFFFF" onPress={stopRecording} />
                  </Animated.View>
                  <Text style={styles.listeningText}>{t("voiceAssistant.listening")}...</Text>
                  <Text style={styles.durationText}>{recordingDuration}s / 10s</Text>
                </View>
              ) : isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color="#FF6B00" />
                  <Text style={styles.processingText}>{t("voiceAssistant.processing")}...</Text>
                </View>
              ) : (
                <View style={styles.idleContainer}>
                  <TouchableOpacity style={styles.micButton} onPress={startListening}>
                    <IconButton icon="microphone" size={40} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.idleText}>{t("voiceAssistant.tapToSpeak")}</Text>
                </View>
              )}

              {transcript ? (
                <View style={styles.resultContainer}>
                  <View style={styles.transcriptContainer}>
                    <Text style={styles.transcriptLabel}>{t("voiceAssistant.youSaid")}:</Text>
                    <Text style={styles.transcriptText}>{transcript}</Text>
                  </View>

                  {response ? (
                    <View style={styles.responseContainer}>
                      <Text style={styles.responseLabel}>{t("voiceAssistant.response")}:</Text>
                      <Text style={styles.responseText}>{response}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorContainer}>
                  <IconButton icon="alert-circle" size={24} color="#F44336" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t("voiceAssistant.examples")}:</Text>
              <Text style={styles.exampleText}>• {t("voiceAssistant.exampleCreateDelivery")}</Text>
              <Text style={styles.exampleText}>• {t("voiceAssistant.exampleTrackDelivery")}</Text>
              <Text style={styles.exampleText}>• {t("voiceAssistant.exampleMarketplace")}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    zIndex: 999,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  assistantContainer: {
    padding: 20,
  },
  listeningContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  listeningText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  durationText: {
    fontSize: 14,
    color: "#757575",
  },
  processingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  processingText: {
    fontSize: 16,
    color: "#212121",
    marginTop: 16,
  },
  idleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  idleText: {
    fontSize: 16,
    color: "#212121",
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  transcriptContainer: {
    marginBottom: 16,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: "#212121",
    fontStyle: "italic",
  },
  responseContainer: {
    marginTop: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  responseText: {
    fontSize: 16,
    color: "#FF6B00",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: "#F44336",
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  footerText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
})

export default VoiceAssistant
