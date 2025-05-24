"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from "react-native"
import { Text, Portal, Modal, ActivityIndicator } from "react-native-paper"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import { useTranslation } from "react-i18next"
import { useTheme } from "../contexts/ThemeContext"
import { useNetwork } from "../contexts/NetworkContext"
import { processVoiceCommand } from "../services/api"
import { requestAudioPermissions, HIGH_QUALITY_RECORDING_OPTIONS } from "../utils/audioUtils"

type VoiceAssistantProps = {}

const VoiceAssistant: React.FC<VoiceAssistantProps> = () => {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { isConnected } = useNetwork()

  const [isListening, setIsListening] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [transcript, setTranscript] = useState<string>("")
  const [response, setResponse] = useState<string>("")
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)

  const pulseAnim = useRef(new Animated.Value(1)).current

  // Vérifier les permissions au démarrage
  useEffect(() => {
    checkPermissions()
  }, [])

  // Animation de pulsation
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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
  }, [isListening, pulseAnim])

  const checkPermissions = async (): Promise<void> => {
    if (Platform.OS === "web") {
      setPermissionGranted(true)
      return
    }

    const hasPermission = await requestAudioPermissions()
    setPermissionGranted(hasPermission)
  }

  const startListening = async (): Promise<void> => {
    if (!permissionGranted) {
      await checkPermissions()
      if (!permissionGranted) return
    }

    try {
      setIsListening(true)
      setModalVisible(true)
      setTranscript("")
      setResponse("")

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      })

      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(HIGH_QUALITY_RECORDING_OPTIONS)
      await recording.startAsync()
      setRecording(recording)

      // Arrêter automatiquement après 10 secondes
      setTimeout(() => {
        if (isListening) {
          stopListening()
        }
      }, 10000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setIsListening(false)
    }
  }

  const stopListening = async (): Promise<void> => {
    if (!recording) return

    try {
      setIsListening(false)
      setIsProcessing(true)

      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)

      if (uri && isConnected) {
        await processRecording(uri)
      } else {
        setTranscript(t("voiceAssistant.offlineMode"))
        setIsProcessing(false)
      }
    } catch (error) {
      console.error("Error stopping recording:", error)
      setIsProcessing(false)
    }
  }

  const processRecording = async (uri: string): Promise<void> => {
    try {
      // Convertir l'enregistrement en base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Envoyer au serveur pour traitement
      const result = await processVoiceCommand(base64Audio)

      setTranscript(result.transcript)
      setResponse(result.response)
    } catch (error) {
      console.error("Error processing voice command:", error)
      setTranscript(t("voiceAssistant.processingError"))
    } finally {
      setIsProcessing(false)
    }
  }

  const closeModal = (): void => {
    setModalVisible(false)
    if (isListening) {
      stopListening()
    }
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={startListening}
        disabled={isListening || isProcessing}
      >
        <Text style={styles.buttonText}>🎤</Text>
      </TouchableOpacity>

      <Portal>
        <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isListening
                ? t("voiceAssistant.listening")
                : isProcessing
                  ? t("voiceAssistant.processing")
                  : t("voiceAssistant.result")}
            </Text>

            {isListening && (
              <Animated.View
                style={[
                  styles.listeningIndicator,
                  { transform: [{ scale: pulseAnim }], backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.microphoneIcon}>🎤</Text>
              </Animated.View>
            )}

            {isProcessing && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

            {transcript ? (
              <View style={styles.resultContainer}>
                <Text style={styles.transcriptLabel}>{t("voiceAssistant.youSaid")}:</Text>
                <Text style={styles.transcript}>{transcript}</Text>

                {response && (
                  <>
                    <Text style={styles.responseLabel}>{t("voiceAssistant.response")}:</Text>
                    <Text style={styles.response}>{response}</Text>
                  </>
                )}
              </View>
            ) : (
              !isListening &&
              !isProcessing && <Text style={styles.noTranscript}>{t("voiceAssistant.noSpeechDetected")}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isListening ? "#F44336" : colors.primary,
                },
              ]}
              onPress={isListening ? stopListening : closeModal}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>
                {isListening ? t("voiceAssistant.stop") : t("voiceAssistant.close")}
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
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
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  buttonText: {
    fontSize: 24,
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  modalContent: {
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  listeningIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  microphoneIcon: {
    fontSize: 32,
    color: "white",
  },
  loader: {
    marginVertical: 20,
  },
  resultContainer: {
    width: "100%",
    marginBottom: 20,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  transcript: {
    fontSize: 16,
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  response: {
    fontSize: 16,
    padding: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  noTranscript: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
})

export default VoiceAssistant
