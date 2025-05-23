"use client"

import { Button } from "@/components/ui/button"

import { Alert } from "@/components/ui/alert"

import { useState, useEffect, useRef } from "react"
import { View, StyleSheet, ActivityIndicator, BackHandler } from "react-native"
import { Text, IconButton } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { WebView } from "react-native-webview"
import { useTranslation } from "react-i18next"
import { useNavigation, useRoute } from "@react-navigation/native"
import PaymentService from "../services/PaymentService"

interface WebPaymentScreenProps {
  paymentUrl: string
  transactionId: string
  onComplete?: (success: boolean) => void
}

const WebPaymentScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  const params = route.params as WebPaymentScreenProps

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const webViewRef = useRef<WebView>(null)

  const paymentUrl = params?.paymentUrl
  const transactionId = params?.transactionId
  const onComplete = params?.onComplete

  useEffect(() => {
    // Gérer le bouton de retour Android
    const backHandler = BackHandler.addEventListener("hardwareBackPress", handleBackPress)

    return () => {
      backHandler.remove()
    }
  }, [])

  const handleBackPress = () => {
    // Demander confirmation avant de quitter
    Alert.alert(t("payment.cancelPayment"), t("payment.cancelConfirmation"), [
      {
        text: t("common.no"),
        style: "cancel",
        onPress: () => {},
      },
      {
        text: t("common.yes"),
        onPress: () => {
          if (onComplete) {
            onComplete(false)
          }
          navigation.goBack()
        },
      },
    ])
    return true // Empêcher le comportement par défaut
  }

  const handleNavigationStateChange = async (navState: any) => {
    // Vérifier si l'URL contient des indicateurs de succès ou d'échec
    const url = navState.url.toLowerCase()

    if (url.includes("payment_success") || url.includes("payment_callback")) {
      setLoading(true)

      try {
        // Vérifier le statut du paiement
        const response = await PaymentService.verifyPayment(transactionId)

        if (response.status === "success" && response.payment_status === "completed") {
          // Paiement réussi
          if (onComplete) {
            onComplete(true)
          }
          navigation.goBack()
        } else if (url.includes("payment_success")) {
          // L'URL indique un succès mais la vérification a échoué
          setError(t("payment.verificationFailed"))
        }
      } catch (err) {
        console.error("Payment verification error:", err)
        setError(t("payment.verificationError"))
      } finally {
        setLoading(false)
      }
    } else if (url.includes("payment_failed") || url.includes("payment_cancelled")) {
      // Paiement échoué ou annulé
      if (onComplete) {
        onComplete(false)
      }
      navigation.goBack()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="close" size={24} onPress={handleBackPress} />
        <Text style={styles.headerTitle}>{t("payment.processing")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.errorButton}>
            {t("common.goBack")}
          </Button>
        </View>
      ) : (
        <>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text style={styles.loadingText}>{t("payment.loading")}</Text>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false)
              setError(t("payment.loadingError"))
            }}
            style={styles.webView}
          />
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
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
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: "#FF6B00",
  },
})

export default WebPaymentScreen
