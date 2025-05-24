import * as FileSystem from "expo-file-system"
import { Audio } from "expo-av"

// Update the readAsStringAsync function
export async function getAudioBase64(uri: string): Promise<string> {
  try {
    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri)
    if (!fileInfo.exists) {
      throw new Error("Audio file does not exist")
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType ? FileSystem.EncodingType.Base64 : "base64",
    })

    return base64
  } catch (error) {
    console.error("Error converting audio to base64:", error)
    throw error
  }
}

export function getAudioRecordingOptions() {
  return {
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
      audioQuality: Audio.IOSAudioQuality.MEDIUM,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000
    }
  }
}
