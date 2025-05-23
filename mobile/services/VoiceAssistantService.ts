import * as Speech from "expo-speech"
import * as FileSystem from "expo-file-system"
import { Audio } from "expo-av"
import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../config/environment"

// Types
export interface VoiceCommand {
  command: string
  confidence: number
  intent: string
  entities: Record<string, any>
}

export interface AssistantResponse {
  text: string
  action?: string
  data?: any
}

class VoiceAssistantService {
  private recording: Audio.Recording | null = null
  private isListening = false
  private audioUri: string | null = null
  private language = "fr-FR"

  // Initialiser le service
  async initialize(): Promise<void> {
    try {
      // Demander les permissions
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        throw new Error("Microphone permission not granted")
      }

      // Charger la langue préférée
      const savedLanguage = await AsyncStorage.getItem("voiceLanguage")
      if (savedLanguage) {
        this.language = savedLanguage
      }

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      })
    } catch (error) {
      console.error("Error initializing voice assistant:", error)
      throw error
    }
  }

  // Démarrer l'écoute
  async startListening(): Promise<void> {
    if (this.isListening) {
      return
    }

    try {
      this.isListening = true

      // Configurer l'enregistrement
      this.recording = new Audio.Recording()
      await this.recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      })

      await this.recording.startAsync()
    } catch (error) {
      this.isListening = false
      console.error("Error starting voice recording:", error)
      throw error
    }
  }

  // Arrêter l'écoute et traiter la commande
  async stopListening(): Promise<VoiceCommand | null> {
    if (!this.isListening || !this.recording) {
      return null
    }

    try {
      // Arrêter l'enregistrement
      await this.recording.stopAndUnloadAsync()
      this.isListening = false

      // Récupérer l'URI de l'audio
      const uri = this.recording.getURI()
      if (!uri) {
        throw new Error("Recording URI is null")
      }
      this.audioUri = uri

      // Traiter l'audio pour obtenir la commande
      return await this.processAudio(uri)
    } catch (error) {
      this.isListening = false
      console.error("Error stopping voice recording:", error)
      return null
    }
  }

  // Traiter l'audio pour obtenir la commande
  private async processAudio(audioUri: string): Promise<VoiceCommand | null> {
    try {
      // Créer un FormData pour envoyer l'audio
      const formData = new FormData()
      formData.append("audio", {
        uri: audioUri,
        type: "audio/m4a",
        name: "recording.m4a",
      } as any)
      formData.append("language", this.language)

      // Envoyer l'audio au serveur pour traitement
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/assistant/voice-command`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      })

      return response.data
    } catch (error) {
      console.error("Error processing audio:", error)
      return null
    }
  }

  // Exécuter une commande vocale
  async executeCommand(command: VoiceCommand): Promise<AssistantResponse> {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await axios.post(`${API_URL}/assistant/execute-command`, command, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      return response.data
    } catch (error) {
      console.error("Error executing command:", error)
      return {
        text: "Je n'ai pas pu exécuter cette commande. Veuillez réessayer.",
      }
    }
  }

  // Parler une réponse
  async speak(text: string): Promise<void> {
    try {
      await Speech.speak(text, {
        language: this.language,
        pitch: 1.0,
        rate: 0.9,
      })
    } catch (error) {
      console.error("Error speaking response:", error)
    }
  }

  // Changer la langue
  async setLanguage(language: string): Promise<void> {
    this.language = language
    await AsyncStorage.setItem("voiceLanguage", language)
  }

  // Nettoyer les ressources
  async cleanup(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync()
      } catch (error) {
        // Ignorer les erreurs lors du nettoyage
      }
      this.recording = null
    }

    if (this.audioUri) {
      try {
        await FileSystem.deleteAsync(this.audioUri)
      } catch (error) {
        // Ignorer les erreurs lors du nettoyage
      }
      this.audioUri = null
    }

    this.isListening = false
  }

  // Vérifier si le service est en train d'écouter
  isCurrentlyListening(): boolean {
    return this.isListening
  }
}

export default new VoiceAssistantService()
