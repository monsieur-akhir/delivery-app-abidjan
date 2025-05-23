"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native"
import { Text, ActivityIndicator, IconButton } from "react-native-paper"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import * as Permissions from "expo-permissions"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../contexts/NetworkContext"

interface VoiceRecorderProps {
  onRecordingComplete: (base64Audio: string) => void
  onTranscriptionComplete?: (text: string) => void
  transcribeAudio?: boolean
  maxDuration?: number
  buttonSize?: number
  buttonColor?: string
  buttonActiveColor?: string
  showTimer?: boolean
  disabled?: boolean
  style?: any
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onTranscriptionComplete,
  transcribeAudio = false,
  maxDuration = 60,
  buttonSize = 64,
  buttonColor = "#FF6B00",
  buttonActiveColor = "#F44336",
  showTimer = true,
  disabled = false,
  style,
}) => {
  const { t } = useTranslation()
  const { isConnected } = useNetwork()

  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [durationTimer, setDurationTimer] = useState<NodeJS.Timeout | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  useEffect(() => {
    checkPermissions()
    return () => {
      if (durationTimer) {
        clearInterval(durationTimer)
      }
      if (recording) {
        stopRecording()
      }
    }
  }, [])

  useEffect(() => {
    if (recordingDuration >= maxDuration && isRecording) {
      stopRecording()
    }
  }, [recordingDuration, maxDuration, isRecording])

  const checkPermissions = async (): Promise<void> => {
    if (Platform.OS === "web") {
      setPermissionGranted(true)
      return
    }

    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING)
    setPermissionGranted(status === "granted")
  }

  const startRecording = async (): Promise<void> => {
    if (disabled) return

    if (!permissionGranted) {
      await checkPermissions()
      if (!permissionGranted) {
        Alert.alert(t("voiceAssistant.permissionDenied"), t("voiceAssistant.microphonePermissionRequired"))
        return
      }
    }

    try {
      setIsRecording(true)
      setRecordingDuration(0)

      // Configure audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      })

      // Start recording
      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY)
      await recording.startAsync()
      setRecording(recording)

      // Start timer
      const timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1)
      }, 1000)
      setDurationTimer(timer)
    } catch (error) {
      console.error("Error starting recording:", error)
      setIsRecording(false)
      Alert.alert(t("rateDelivery.recordingError"), t("rateDelivery.couldNotStartRecording"))
    }
  }

  const stopRecording = async (): Promise<void> => {
    if (!recording) return

    try {
      // Stop timer
      if (durationTimer) {
        clearInterval(durationTimer)
        setDurationTimer(null)
      }

      // Stop recording
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecording(null)
      setIsRecording(false)

      if (uri) {
        setIsProcessing(true)

        // Convert recording to base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        })

        // Pass the base64 audio to the parent component
        onRecordingComplete(base64Audio)

        // Transcribe if needed and online
        if (transcribeAudio && isConnected && onTranscriptionComplete) {
          try {
            // Transcription would be handled by the parent component
            // This is just a placeholder for the flow
            onTranscriptionComplete("")
          } catch (error) {
            console.error("Error transcribing audio:", error)
          }
        } else if (transcribeAudio && !isConnected && onTranscriptionComplete) {
          Alert.alert(t("rateDelivery.offlineMode"), t("rateDelivery.cannotTranscribeOffline"))
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error)
      Alert.alert(t("rateDelivery.recordingError"), t("rateDelivery.couldNotStopRecording"))
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <View style={[styles.container, style]}>
      {showTimer && isRecording && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.recordButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: isRecording ? buttonActiveColor : buttonColor,
          },
          disabled && styles.disabledButton,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator color="#FFFFFF" size={buttonSize / 3} />
        ) : (
          <IconButton
            icon={isRecording ? "stop" : "microphone"}
            size={buttonSize / 2}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
        )}
      </TouchableOpacity>

      {isRecording && (
        <Text style={styles.recordingText}>
          {t("voiceAssistant.recording")} {showTimer ? `(${formatDuration(recordingDuration)})` : ""}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
    opacity: 0.7,
  },
  buttonIcon: {
    margin: 0,
  },
  timerContainer: {
    marginBottom: 8,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  recordingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#F44336",
  },
})

export default VoiceRecorder
