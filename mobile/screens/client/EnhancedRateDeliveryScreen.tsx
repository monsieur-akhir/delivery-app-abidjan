"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from "react-native"
import { Text, Card, Button, TextInput, Divider, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Audio } from "expo-av"
import * as FileSystem from "expo-file-system"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, submitRating, transcribeVoiceRating } from "../../services/api"
import StarRating from "../../components/StarRating"
import FeatherIcon from "../../components/FeatherIcon"
import { requestPermission } from "../../utils/permissions"
import { getAudioRecordingOptions } from "../../utils/audioUtils"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery, PendingOperation } from "../../types/models"

type EnhancedRateDeliveryScreenProps = {
  route: RouteProp<RootStackParamList, "EnhancedRateDelivery">
  navigation: NativeStackNavigationProp<RootStackParamList, "EnhancedRateDelivery">
}

const EnhancedRateDeliveryScreen: React.FC<EnhancedRateDeliveryScreenProps> = ({ route, navigation }) => {
  const { deliveryId } = route.params
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [transcribing, setTranscribing] = useState<boolean>(false)
  const [recordingDuration, setRecordingDuration] = useState<number>(0)
  const [durationTimer, setDurationTimer] = useState<NodeJS.Timeout | number | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false)
  const [ratingAspects, setRatingAspects] = useState({
    punctuality: 5,
    communication: 5,
    professionalism: 5,
    packageHandling: 5,
  })

  useEffect(() => {
    loadDeliveryDetails()
    checkPermissions()

    return () => {
      if (durationTimer) {
        clearInterval(durationTimer)
      }
    }
  }, [deliveryId])

  const checkPermissions = async (): Promise<void> => {
    if (Platform.OS === "web") {
      setPermissionGranted(true)
      return
    }

    const granted = await requestPermission("microphone")
    setPermissionGranted(granted)
  }

  const loadDeliveryDetails = async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)

      // Vérifier si la livraison a déjà été évaluée
      if (data.rating && typeof data.rating === 'object') {
        setRating(data.rating.rating || 5)
        setComment(data.rating.comment || "")
        Alert.alert(t("rateDelivery.alreadyRated"), t("rateDelivery.alreadyRatedMessage"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("DeliveryDetails", { deliveryId }),
          },
        ])
      }
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError(t("rateDelivery.errorLoadingDelivery"))
    } finally {
      setLoading(false)
    }
  }

  const handleRatingChange = (value: number): void => {
    setRating(value)
  }

  const handleAspectRatingChange = (aspect: string, value: number): void => {
    setRatingAspects({
      ...ratingAspects,
      [aspect]: value,
    })
  }

  const startRecording = async (): Promise<void> => {
    if (!permissionGranted) {
      await checkPermissions()
      if (!permissionGranted) {
        Alert.alert(t("rateDelivery.permissionDenied"), t("rateDelivery.microphonePermissionRequired"))
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
      await recording.prepareToRecordAsync(getAudioRecordingOptions())
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
        setTranscribing(true)

        if (isConnected) {
          // Convert recording to base64
          const base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          })

          // Transcribe audio
          const result = await transcribeVoiceRating(base64Audio)
          setComment(result.text)
        } else {
          Alert.alert(t("rateDelivery.offlineMode"), t("rateDelivery.cannotTranscribeOffline"))
        }
      }
    } catch (error) {
      console.error("Error stopping recording:", error)
      Alert.alert(t("rateDelivery.recordingError"), t("rateDelivery.couldNotStopRecording"))
    } finally {
      setTranscribing(false)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const handleSubmit = async (): Promise<void> => {
    if (!delivery || !delivery.courier) {
      setError(t("rateDelivery.errorDeliveryNotFound"))
      return
    }

    try {
      setSubmitting(true)

      // Calculate average of aspect ratings
      const aspectAverage =
        Object.values(ratingAspects).reduce((sum, value) => sum + value, 0) / Object.values(ratingAspects).length

      // Use the overall rating provided by the user
      const finalRating = rating

      const ratingData = {
        delivery_id: deliveryId,
        courier_id: delivery.courier.id.toString(),
        rating: finalRating,
        comment,
        aspects: ratingAspects,
      }

      if (isConnected) {
        await submitRating(ratingData)

        Alert.alert(t("rateDelivery.thankYou"), t("rateDelivery.ratingSubmitted"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("ClientHome"),
          },
        ])
      } else {
        // Stocker l'évaluation pour synchronisation ultérieure
        addPendingUpload({
          type: "submit_rating",
          data: ratingData,
        } as PendingOperation)

        Alert.alert(t("rateDelivery.thankYou"), t("rateDelivery.offlineRatingSubmitted"), [
          {
            text: "OK",
            onPress: () => navigation.navigate("ClientHome"),
          },
        ])
      }
    } catch (error) {
      console.error("Error submitting rating:", error)
      setError(error instanceof Error ? error.message : t("rateDelivery.errorSubmittingRating"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = (): void => {
    Alert.alert(t("rateDelivery.skipRating"), t("rateDelivery.skipRatingMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: "OK",
        onPress: () => navigation.navigate("ClientHome"),
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FeatherIcon name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("rateDelivery.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!delivery || !delivery.courier) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FeatherIcon name="arrow-left" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.errorContainer}>
          <FeatherIcon name="alert-circle" size={50} color="#F44336" />
          <Text style={styles.errorText}>{error || t("rateDelivery.deliveryNotFound")}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
            {t("common.back")}
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FeatherIcon name="arrow-left" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("rateDelivery.title")}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.deliveryCard}>
          <Card.Content>
            <Text style={styles.deliveryTitle}>{t("rateDelivery.deliveryCompleted")}</Text>
            <Text style={styles.deliverySubtitle}>
              {t("rateDelivery.deliveryId")}: #{deliveryId}
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.courierInfo}>
              <FeatherIcon
                name="user"
                size={40}
                color="#FF6B00"
                style={{
                  margin: 0,
                  backgroundColor: "#FFF3E0",
                  borderRadius: 20,
                }}
              />
              <View style={styles.courierDetails}>
                <Text style={styles.courierName}>{delivery.courier.name}</Text>
                <Text style={styles.courierVehicle}>{"Standard Vehicle"}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.addressContainer}>
              <View style={styles.addressItem}>
                <FeatherIcon name="map-pin" size={20} color="#FF6B00" style={{ margin: 0, padding: 0 }} />
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("rateDelivery.from")}</Text>
                  <Text style={styles.addressText}>{delivery.pickup_address}</Text>
                </View>
              </View>

              <View style={styles.addressDivider}>
                <View style={styles.addressDividerLine} />
              </View>

              <View style={styles.addressItem}>
                <FeatherIcon name="map-pin" size={20} color="#4CAF50" style={{ margin: 0, padding: 0 }} />
                <View style={styles.addressContent}>
                  <Text style={styles.addressLabel}>{t("rateDelivery.to")}</Text>
                  <Text style={styles.addressText}>{delivery.delivery_address}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.ratingCard}>
          <Card.Content>
            <Text style={styles.ratingTitle}>{t("rateDelivery.rateExperience")}</Text>
            <Text style={styles.ratingSubtitle}>{t("rateDelivery.rateExperienceDescription")}</Text>

            <View style={styles.starsContainer}>
              <StarRating rating={rating} onRatingChange={handleRatingChange} size={40} editable />
              <Text style={styles.ratingText}>
                {rating === 1
                  ? t("rateDelivery.terrible")
                  : rating === 2
                    ? t("rateDelivery.bad")
                    : rating === 3
                      ? t("rateDelivery.okay")
                      : rating === 4
                        ? t("rateDelivery.good")
                        : t("rateDelivery.excellent")}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.aspectsTitle}>{t("rateDelivery.rateAspects")}</Text>

            <View style={styles.aspectItem}>
              <Text style={styles.aspectLabel}>{t("rateDelivery.punctuality")}</Text>
              <StarRating
                rating={ratingAspects.punctuality}
                onRatingChange={(value) => handleAspectRatingChange("punctuality", value)}
                size={24}
                editable
              />
            </View>

            <View style={styles.aspectItem}>
              <Text style={styles.aspectLabel}>{t("rateDelivery.communication")}</Text>
              <StarRating
                rating={ratingAspects.communication}
                onRatingChange={(value) => handleAspectRatingChange("communication", value)}
                size={24}
                editable
              />
            </View>

            <View style={styles.aspectItem}>
              <Text style={styles.aspectLabel}>{t("rateDelivery.professionalism")}</Text>
              <StarRating
                rating={ratingAspects.professionalism}
                onRatingChange={(value) => handleAspectRatingChange("professionalism", value)}
                size={24}
                editable
              />
            </View>

            <View style={styles.aspectItem}>
              <Text style={styles.aspectLabel}>{t("rateDelivery.packageHandling")}</Text>
              <StarRating
                rating={ratingAspects.packageHandling}
                onRatingChange={(value) => handleAspectRatingChange("packageHandling", value)}
                size={24}
                editable
              />
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.commentTitle}>{t("rateDelivery.leaveComment")}</Text>

            <View style={styles.voiceInputContainer}>
              <TouchableOpacity
                style={[styles.voiceButton, isRecording && styles.recordingButton]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={transcribing}
              >
                <FeatherIcon name={isRecording ? "square" : "mic"} size={24} color="#FFFFFF" style={{ margin: 0 }} />
                <Text style={styles.voiceButtonText}>
                  {isRecording
                    ? `${t("rateDelivery.recording")} (${formatDuration(recordingDuration)})`
                    : t("rateDelivery.recordComment")}
                </Text>
              </TouchableOpacity>

              {transcribing && (
                <View style={styles.transcribingContainer}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.transcribingText}>{t("rateDelivery.transcribing")}</Text>
                </View>
              )}
            </View>

            <TextInput
              label={t("rateDelivery.comment")}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              style={styles.commentInput}
              placeholder={t("rateDelivery.commentPlaceholder")}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.buttonContainer}>
              <Button mode="outlined" onPress={handleSkip} style={styles.skipButton} disabled={submitting}>
                {t("rateDelivery.skip")}
              </Button>

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                loading={submitting}
                disabled={submitting}
              >
                {t("rateDelivery.submit")}
              </Button>
            </View>
          </Card.Content>
        </Card>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginVertical: 16,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#FF6B00",
  },
  scrollContainer: {
    padding: 16,
  },
  deliveryCard: {
    marginBottom: 16,
  },
  deliveryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  deliverySubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  divider: {
    marginVertical: 16,
  },
  courierInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  courierDetails: {
    marginLeft: 16,
  },
  courierName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  courierVehicle: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  addressContainer: {
    marginBottom: 8,
  },
  addressItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressContent: {
    flex: 1,
    marginLeft: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: "#757575",
  },
  addressText: {
    fontSize: 14,
    color: "#212121",
    marginTop: 2,
  },
  addressDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 28,
    marginVertical: 4,
  },
  addressDividerLine: {
    flex: 1,
    height: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#E0E0E0",
    marginLeft: 10,
  },
  ratingCard: {
    marginBottom: 16,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
  },
  starsContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  skipButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#757575",
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
  },
  aspectsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  aspectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aspectLabel: {
    fontSize: 14,
    color: "#212121",
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  voiceInputContainer: {
    marginBottom: 16,
  },
  voiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B00",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  recordingButton: {
    backgroundColor: "#F44336",
  },
  voiceButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
  transcribingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  transcribingText: {
    marginLeft: 8,
    color: "#757575",
  },
})

export default EnhancedRateDeliveryScreen
