import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"

export interface VoiceCommand {
  command: string
  intent?: string
  entities?: Record<string, any>
}

export interface VoiceResponse {
  text: string
  action?: string
  data?: any
}

class VoiceAssistantService {
  private recording: Audio.Recording | null = null
  private speechRecognitionEnabled = false

  /**
   * Initialiser le service d'assistant vocal
   */
  async initialize(): Promise<void> {
    try {
      // Vérifier les permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        throw new Error("Microphone permission not granted")
      }

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      })

      this.speechRecognitionEnabled = true
    } catch (error) {
      console.error("Error initializing voice assistant:", error)
      this.speechRecognitionEnabled = false
      throw error
    }
  }

  /**
   * Démarrer l'écoute
   */
  async startListening(): Promise<void> {
    if (!this.speechRecognitionEnabled) {
      await this.initialize()
    }

    if (this.recording) {
      await this.stopListening()
    }

    try {
      this.recording = new Audio.Recording()
      await this.recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4 || 2,
          audioEncoder: Audio.AndroidAudioEncoder.AAC || 3,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC || "aac",
          audioQuality: Audio.IOSAudioQuality.HIGH || "high",
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      })
      await this.recording.startAsync()
    } catch (error) {
      console.error("Error starting recording:", error)
      this.recording = null
      throw error
    }
  }

  /**
   * Arrêter l'écoute et traiter la commande
   */
  async stopListening(): Promise<VoiceCommand> {
    if (!this.recording) {
      return { command: "" }
    }

    try {
      await this.recording.stopAndUnloadAsync()
      const uri = this.recording.getURI()
      this.recording = null

      if (!uri) {
        return { command: "" }
      }

      // Convertir l'enregistrement en base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Envoyer au serveur pour reconnaissance vocale
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${API_URL}/assistant/recognize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ audio: base64Audio }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error("Error stopping recording:", error)
      return { command: "" }
    }
  }

  /**
   * Exécuter une commande vocale
   */
  async executeCommand(command: VoiceCommand): Promise<VoiceResponse> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${API_URL}/assistant/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(command),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error executing command:", error)
      return {
        text: "Je n'ai pas pu exécuter cette commande. Veuillez réessayer.",
      }
    }
  }

  /**
   * Lire un texte à haute voix
   */
  async speak(text: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${API_URL}/assistant/speak`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const { audio } = await response.json()

      // Créer un fichier temporaire pour l'audio
      const fileUri = FileSystem.documentDirectory + "temp_speech.mp3"
      await FileSystem.writeAsStringAsync(fileUri, audio, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Jouer l'audio
      const { sound } = await Audio.Sound.createAsync({ uri: fileUri })
      await sound.playAsync()
    } catch (error) {
      console.error("Error speaking text:", error)
    }
  }

  /**
   * Nettoyer les ressources
   */
  async cleanup(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync()
      } catch (error) {
        // Ignorer les erreurs lors du nettoyage
      }
      this.recording = null
    }
  }
}

export default new VoiceAssistantService()
