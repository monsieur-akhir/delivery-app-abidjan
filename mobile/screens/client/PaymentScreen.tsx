"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from "react-native"
import { Text, Card, Button, RadioButton, TextInput, Divider, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { fetchDeliveryDetails, initiatePayment, verifyPayment } from "../../services/api"
import { formatPrice } from "../../utils/formatters"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import type { Delivery } from "../../types/models"

type PaymentScreenProps = {
  route: RouteProp<RootStackParamList, "Payment">
  navigation: NativeStackNavigationProp<RootStackParamList, "Payment">
}

type PaymentMethod = "orange_money" | "mtn_momo" | "cash"
type PaymentStep = "select_method" | "enter_otp" | "success"

const PaymentScreen: React.FC<PaymentScreenProps> = ({ route, navigation }) => {
  const { deliveryId, amount } = route.params
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isConnected } = useNetwork()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("orange_money")
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phone || "")
  const [otp, setOtp] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [processingPayment, setProcessingPayment] = useState<boolean>(false)
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("select_method")
  const [paymentReference, setPaymentReference] = useState<string | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    loadDeliveryDetails()
  }, [deliveryId])

  const loadDeliveryDetails = async (): Promise<void> => {
    try {
      setLoading(true)
      const data = await fetchDeliveryDetails(deliveryId)
      setDelivery(data)
    } catch (error) {
      console.error("Error loading delivery details:", error)
      setError(t("payment.errorLoadingDelivery"))
    } finally {
      setLoading(false)
    }
  }

  const handleInitiatePayment = async (): Promise<void> => {
    if (!isConnected) {
      Alert.alert(t("payment.offlineTitle"), t("payment.offlinePayment"))
      return
    }

    if (!phoneNumber) {
      setError(t("payment.errorPhoneRequired"))
      return
    }

    try {
      setProcessingPayment(true)

      const paymentData = {
        delivery_id: deliveryId,
        amount: amount || delivery?.proposed_price || 0,
        payment_method: paymentMethod,
        phone_number: phoneNumber,
      }

      const response = await initiatePayment(paymentData)

      if (response && response.reference) {
        setPaymentReference(response.reference)
        setPaymentStep("enter_otp")
      } else {
        throw new Error(t("payment.errorInitiatingPayment"))
      }
    } catch (error) {
      console.error("Error initiating payment:", error)
      setError(error instanceof Error ? error.message : t("payment.errorInitiatingPayment"))
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleVerifyPayment = async (): Promise<void> => {
    if (!otp) {
      setError(t("payment.errorOtpRequired"))
      return
    }

    try {
      setProcessingPayment(true)

      if (!paymentReference) {
        setError(t("payment.errorPaymentReference"))
        return
      }

      const verificationData = {
        reference: paymentReference,
        otp: otp,
      }

      const response = await verifyPayment(verificationData)

      if (response && response.status === "success") {
        setPaymentStep("success")
      } else {
        throw new Error(response.message || t("payment.errorVerifyingPayment"))
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
      setError(error instanceof Error ? error.message : t("payment.errorVerifyingPayment"))
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleCashPayment = (): void => {
    Alert.alert(t("payment.cashPaymentTitle"), t("payment.cashPaymentMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: () => {
          // Simuler un paiement en espèces réussi
          setPaymentStep("success")
        },
      },
    ])
  }

  const renderPaymentMethodSelection = (): React.ReactElement => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>{t("payment.selectMethod")}</Text>

        <RadioButton.Group onValueChange={(value) => setPaymentMethod(value as PaymentMethod)} value={paymentMethod}>
          <View style={styles.paymentOption}>
            <Image source={require("../../assets/orange-money.png")} style={styles.paymentLogo} resizeMode="contain" />
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Orange Money</Text>
              <Text style={styles.paymentOptionDescription}>{t("payment.orangeMoneyDescription")}</Text>
            </View>
            <RadioButton value="orange_money" />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.paymentOption}>
            <Image source={require("../../assets/mtn-momo.png")} style={styles.paymentLogo} resizeMode="contain" />
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>MTN Mobile Money</Text>
              <Text style={styles.paymentOptionDescription}>{t("payment.mtnMomoDescription")}</Text>
            </View>
            <RadioButton value="mtn_momo" />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.paymentOption}>
            <Image source={require("../../assets/cash.png")} style={styles.paymentLogo} resizeMode="contain" />
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>{t("payment.cash")}</Text>
              <Text style={styles.paymentOptionDescription}>{t("payment.cashDescription")}</Text>
            </View>
            <RadioButton value="cash" />
          </View>
        </RadioButton.Group>

        <TextInput
          label={t("payment.phoneNumber")}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          style={styles.input}
          disabled={paymentMethod === "cash"}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={paymentMethod === "cash" ? handleCashPayment : handleInitiatePayment}
          style={styles.button}
          loading={processingPayment}
          disabled={processingPayment}
        >
          {t("payment.proceed")}
        </Button>
      </Card.Content>
    </Card>
  )

  const renderOtpVerification = (): React.ReactElement => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.sectionTitle}>{t("payment.enterOtp")}</Text>

        <Text style={styles.otpInstructions}>{t("payment.otpInstructions", { phoneNumber })}</Text>

        <TextInput
          label={t("payment.otp")}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          style={styles.input}
          maxLength={6}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={() => setPaymentStep("select_method")}
            style={[styles.button, styles.cancelButton]}
            disabled={processingPayment}
          >
            {t("common.back")}
          </Button>

          <Button
            mode="contained"
            onPress={handleVerifyPayment}
            style={[styles.button, styles.confirmButton]}
            loading={processingPayment}
            disabled={processingPayment}
          >
            {t("payment.verify")}
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  const renderPaymentSuccess = (): React.ReactElement => (
    <Card style={styles.card}>
      <Card.Content style={styles.successContent}>
        <Image source={require("../../assets/payment-success.png")} style={styles.successImage} resizeMode="contain" />

        <Text style={styles.successTitle}>{t("payment.paymentSuccessful")}</Text>

        <Text style={styles.successMessage}>{t("payment.successMessage")}</Text>

        <View style={styles.paymentDetails}>
          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>{t("payment.amount")}</Text>
            <Text style={styles.paymentDetailValue}>{formatPrice(amount || delivery?.proposed_price || 0)} FCFA</Text>
          </View>

          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>{t("payment.method")}</Text>
            <Text style={styles.paymentDetailValue}>
              {paymentMethod === "orange_money"
                ? "Orange Money"
                : paymentMethod === "mtn_momo"
                  ? "MTN Mobile Money"
                  : t("payment.cash")}
            </Text>
          </View>

          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>{t("payment.reference")}</Text>
            <Text style={styles.paymentDetailValue}>
              {paymentReference || "CASH-" + Date.now().toString().substring(6)}
            </Text>
          </View>

          <View style={styles.paymentDetailRow}>
            <Text style={styles.paymentDetailLabel}>{t("payment.date")}</Text>
            <Text style={styles.paymentDetailValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={() => navigation.navigate("DeliveryDetails", { deliveryId })}
          style={styles.button}
        >
          {t("payment.backToDelivery")}
        </Button>
      </Card.Content>
    </Card>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>{t("common.back")}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("payment.title")}</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("payment.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{t("common.back")}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("payment.title")}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>{t("payment.summary")}</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("payment.delivery")}</Text>
              <Text style={styles.summaryValue}>#{deliveryId}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("payment.from")}</Text>
              <Text style={styles.summaryValue}>{delivery?.pickup_commune}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("payment.to")}</Text>
              <Text style={styles.summaryValue}>{delivery?.delivery_commune}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("payment.total")}</Text>
              <Text style={styles.totalValue}>{formatPrice(amount || delivery?.proposed_price || 0)} FCFA</Text>
            </View>
          </Card.Content>
        </Card>

        {paymentStep === "select_method" && renderPaymentMethodSelection()}
        {paymentStep === "enter_otp" && renderOtpVerification()}
        {paymentStep === "success" && renderPaymentSuccess()}
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
  backButton: {
    color: "#FF6B00",
    fontSize: 16,
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
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#757575",
  },
  summaryValue: {
    fontSize: 14,
    color: "#212121",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  paymentLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  paymentOptionContent: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: "#757575",
  },
  divider: {
    marginVertical: 8,
  },
  input: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#757575",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
  },
  otpInstructions: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 16,
    lineHeight: 20,
  },
  successContent: {
    alignItems: "center",
  },
  successImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  paymentDetails: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  paymentDetailLabel: {
    fontSize: 14,
    color: "#757575",
  },
  paymentDetailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
})

export default PaymentScreen
