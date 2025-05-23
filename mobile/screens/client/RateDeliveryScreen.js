"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from "react-native"
import { Text, Card, Button, TextInput, Divider, ActivityIndicator, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import { useTranslation } from "react-i18next"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, createRating } from "../../services/api"
import StarRating from "../../components/StarRating"

const RateDeliveryScreen = ({ route, navigation }) => {
  const { deliveryId, courierId } = route.params
  const { t } = useTranslation()
  const { isConnected, addPendingUpload } = useNetwork()

  const [delivery, setDelivery] = useState(null)
  const [courier, setCourier] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [recording, setRecording] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingUri, setRecordingUri] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [recordingTimer, setRecordingTimer] = useState(null)

  useEffect(() => {
    loadDeliveryDetails()

    // Nettoyer l'enregistrement à la sortie
    return () => {
      if (recording) {
        stopRecording()
      }

      if (recordingTimer) {
        clearInterval(recordingTimer)
      }
    }
  }, [deliveryId])

  const loadDeliveryDetails = async () => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)

      if (data.courier) {
        setCourier(data.courier)
      }
    } catch (error) {
      console.error("Error loading delivery details:", error)
      Alert.alert(t("rateDelivery.error"), t("rateDelivery.errorLoadingDelivery"))
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      // Demander la permission d'enregistrer
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t("rateDelivery.permissionDenied"), t("rateDelivery.microphonePermission"))
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
      setIsRecording(true)

      // Démarrer le chronomètre
      let duration = 0
      const timer = setInterval(() => {
        duration += 1
        setRecordingDuration(duration)

        // Limiter l'enregistrement à 60 secondes
        if (duration >= 60) {
          stopRecording()
        }
      }, 1000)

      setRecordingTimer(timer)
    } catch (error) {
      console.error("Error starting recording:", error)
      Alert.alert(t("rateDelivery.error"), t("rateDelivery.errorStartingRecording"))
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
      await recording.stopAndUnloadAsync()
      const uri = recording.getURI()
      setRecordingUri(uri)
      setIsRecording(false)

      // Réinitialiser l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      })
    } catch (error) {
      console.error("Error stopping recording:", error)
      Alert.alert(t("rateDelivery.error"), t("rateDelivery.errorStoppingRecording"))
    }
  }

  const playRecording = async () => {
    try {
      if (!recordingUri) return

      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri })
      await sound.playAsync()
    } catch (error) {
      console.error("Error playing recording:", error)
      Alert.alert(t("rateDelivery.error"), t("rateDelivery.errorPlayingRecording"))
    }
  }

  const deleteRecording = () => {
    Alert.alert(t("rateDelivery.deleteRecordingTitle"), t("rateDelivery.deleteRecordingMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: () => {
          setRecordingUri(null)
          setRecordingDuration(0)
        },
      },
    ])
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const handleSubmit = async () => {
    if (!isConnected) {
      Alert.alert(t("rateDelivery.offlineTitle"), t("rateDelivery.offlineRating"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.saveOffline"),
          onPress: saveRatingOffline,
        },
      ])
      return
    }

    try {
      setSubmitting(true)

      // Préparer les données de l'évaluation
      const ratingData = {
        delivery_id: deliveryId,
        courier_id: courierId,
        rating: rating,
        comment: comment,
      }

      // Ajouter l'enregistrement vocal si disponible
      if (recordingUri) {
        const base64Audio = await FileSystem.readAsStringAsync(recordingUri, {
          encoding: FileSystem.EncodingType.Base64,
        })
        ratingData.voice_comment = base64Audio
      }

      // Envoyer l'évaluation
      await createRating(ratingData)

      Alert.alert(t("rateDelivery.success"), t("rateDelivery.ratingSubmitted"), [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("Error submitting rating:", error)
      Alert.alert(t("rateDelivery.error"), t("rateDelivery.errorSubmittingRating"))
    } finally {
      setSubmitting(false)
    }
  }

  const saveRatingOffline = () => {
    try {
      // Préparer les données de l'évaluation
      const ratingData = {
        delivery_id: deliveryId,
        courier_id: courierId,
        rating: rating,
        comment: comment,
        timestamp: new Date().toISOString(),
      }

      // Ajouter à la file d'attente pour synchronisation ultérieure
      addPendingUpload({
        type: "rating",
        data: ratingData,
      })

      Alert.alert(t("rateDelivery.savedOffline"), t("rateDelivery.ratingSavedOffline"), [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("Error saving rating offline:", error)
      Alert.alert(t("rateDelivery.error"), t("rateDelivery.errorSavingOffline"))
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconButton icon="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("rateDelivery.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {courier && (
          <Card style={styles.courierCard}>
            <Card.Content>
              <View style={styles.courierHeader}>
                <View style={styles.courierInfo}>
                  <Text style={styles.courierTitle}>{t("rateDelivery.yourCourier")}</Text>
                  <Text style={styles.courierName}>{courier.full_name}</Text>
                </View>
                {courier.profile_picture ? (
                  <Image source={{ uri: courier.profile_picture }} style={styles.courierImage} />
                ) : (
                  <View style={styles.courierImagePlaceholder}>
                    <IconButton icon="account" size={30} color="#FFFFFF" />
                  </View>
                )}
              </View>

              <Divider style={styles.divider} />

              <View style={styles.deliveryInfo}>
                <Text style={styles.deliveryInfoTitle}>{t("rateDelivery.deliveryInfo")}</Text>
                <Text style={styles.deliveryInfoText}>
                  {t("rateDelivery.from")} {delivery?.pickup_commune} {t("rateDelivery.to")}{" "}
                  {delivery?.delivery_commune}
                </Text>
                <Text style={styles.deliveryInfoText}>
                  {t("rateDelivery.deliveryId")}: #{delivery?.id}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.ratingCard}>
          <Card.Content>
            <Text style={styles.ratingTitle}>{t("rateDelivery.rateExperience")}</Text>

            <View style={styles.starsContainer}>
              <StarRating rating={rating} size={40} onRatingChange={setRating} />
            </View>

            <Text style={styles.ratingDescription}>
              {rating === 5
                ? t("rateDelivery.excellent")
                : rating === 4
                  ? t("rateDelivery.good")
                  : rating === 3
                    ? t("rateDelivery.average")
                    : rating === 2
                      ? t("rateDelivery.poor")
                      : t("rateDelivery.terrible")}
            </Text>

            <TextInput
              label={t("rateDelivery.comment")}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              style={styles.commentInput}
              placeholder={t("rateDelivery.commentPlaceholder")}
            />

            <Text style={styles.voiceCommentTitle}>{t("rateDelivery.voiceComment")}</Text>

            {recordingUri ? (
              <View style={styles.recordingContainer}>
                <View style={styles.recordingInfo}>
                  <IconButton icon="microphone" size={24} color="#FF6B00" />
                  <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
                </View>

                <View style={styles.recordingActions}>
                  <IconButton icon="play" size={24} color="#4CAF50" onPress={playRecording} />
                  <IconButton icon="delete" size={24} color="#F44336" onPress={deleteRecording} />
                </View>
              </View>
            ) : isRecording ? (
              <View style={styles.recordingContainer}>
                <View style={styles.recordingInfo}>
                  <IconButton icon="microphone" size={24} color="#F44336" style={styles.pulsingIcon} />
                  <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
                </View>

                <Button mode="contained" onPress={stopRecording} style={styles.stopButton} icon="stop">
                  {t("rateDelivery.stopRecording")}
                </Button>
              </View>
            ) : (
              <Button mode="outlined" onPress={startRecording} style={styles.recordButton} icon="microphone">
                {t("rateDelivery.startRecording")}
              </Button>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={submitting}
          disabled={submitting}
        >
          {t("rateDelivery.submit")}
        </Button>

        <Text style={styles.skipText} onPress={() => navigation.goBack()}>
          {t("rateDelivery.skipForNow")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#757575",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  courierCard: {
    marginBottom: 16,
  },
  courierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courierInfo: {
    flex: 1,
  },
  courierTitle: {
    fontSize: 14,
    color: "#757575",
  },
  courierName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginVertical: 4,
  },
  courierImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  courierImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    marginVertical: 16,
  },
  deliveryInfo: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  deliveryInfoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  deliveryInfoText: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  ratingCard: {
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  ratingDescription: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    textAlign: "center",
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  voiceCommentTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  recordButton: {
    borderColor: "#FF6B00",
    marginBottom: 8,
  },
  recordingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recordingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordingDuration: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  recordingActions: {
    flexDirection: "row",
  },
  pulsingIcon: {
    // Animation de pulsation à implémenter
  },
  stopButton: {
    backgroundColor: "#F44336",
  },
  submitButton: {
    backgroundColor: "#FF6B00",
    marginBottom: 16,
  },
  skipText: {
    textAlign: "center",
    color: "#757575",
    textDecorationLine: "underline",
  },
})

export default RateDeliveryScreen
