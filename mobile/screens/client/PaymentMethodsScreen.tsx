"use client"

import React, { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native"
import { Text, Card, RadioButton, Divider, Button, IconButton, TextInput } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RouteProp } from "@react-navigation/native"
import type { RootStackParamList } from "../../types/navigation"
import PaymentService, { type PaymentMethod, type PaymentInitiationResponse } from "../../services/PaymentService"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"

interface PaymentMethodsScreenProps {
  deliveryId?: number | string
  amount?: number
  onPaymentComplete?: (transactionId: string) => void
  isWalletTopUp?: boolean
}

const PaymentMethodsScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "Payment">>()
  const route = useRoute<RouteProp<RootStackParamList, "Payment">>()
  const params = route.params as PaymentMethodsScreenProps

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState<string | null>(null)

  const isWalletTopUp = params?.isWalletTopUp || false
  const deliveryId = params?.deliveryId
  const amount = params?.amount || 0
  const onPaymentComplete = params?.onPaymentComplete

  const fetchPaymentMethods = async (): Promise<void> => {
    try {
      setLoading(true)
      const methods = await PaymentService.getPaymentMethods()
      setPaymentMethods(methods)
      if (methods.length > 0 && methods[0].enabled) {
        setSelectedMethod(methods[0].id)
      }
    } catch (err: unknown) {
      console.error("Error fetching payment methods:", err)
      setError(t("payment.errorFetchingMethods"))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const handlePayment = async (): Promise<void> => {
    if (!selectedMethod) {
      Alert.alert(t("payment.error"), t("payment.selectMethod"))
      return
    }
    try {
      setProcessing(true)
      setError(null)
      const isMobileMoneyMethod = ["orange_money", "mtn_money", "moov_money"].includes(selectedMethod)
      if (isMobileMoneyMethod && !phoneNumber) {
        Alert.alert(t("payment.error"), t("payment.enterPhoneNumber"))
        setProcessing(false)
        return
      }
      let response: PaymentInitiationResponse
      if (isWalletTopUp) {
        response = await PaymentService.topUpWallet({
          amount,
          payment_method: selectedMethod,
          phone: isMobileMoneyMethod ? phoneNumber : undefined,
        })
      } else {
        if (!deliveryId) {
          throw new Error("Delivery ID is required")
        }
        response = await PaymentService.initiatePayment({
          delivery_id: deliveryId,
          amount,
          payment_method: selectedMethod,
          phone: isMobileMoneyMethod ? phoneNumber : undefined,
        })
      }
      if (response.status === "success" && response.payment_url) {
        navigation.navigate("WebPayment", {
          paymentUrl: response.payment_url,
          transactionId: response.transaction_id,
          onComplete: (success: boolean) => {
            if (success && onPaymentComplete) {
              onPaymentComplete(response.transaction_id)
            }
          },
        })
      } else if (response.status === "success") {
        Alert.alert(t("payment.success"), t("payment.processedSuccessfully"), [
          {
            text: t("common.ok"),
            onPress: () => {
              if (onPaymentComplete) {
                onPaymentComplete(response.transaction_id)
              } else {
                navigation.goBack()
              }
            },
          },
        ])
      } else {
        throw new Error(response.message || t("payment.unknownError"))
      }
    } catch (err: unknown) {
      console.error("Payment error:", err)
      let errorMessage = t("payment.processingError")
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === "string") {
        errorMessage = err
      }
      setError(errorMessage)
      Alert.alert(t("payment.error"), errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  const getPaymentMethodIcon = (methodId: string) => {
    switch (methodId) {
      case "cash":
        return <MaterialCommunityIcons name="cash" size={24} color="#4CAF50" />
      case "orange_money":
        return <FontAwesome5 name="money-bill-wave" size={24} color="#FF6D00" />
      case "mtn_money":
        return <FontAwesome5 name="money-bill-wave" size={24} color="#FFEB3B" />
      case "moov_money":
        return <FontAwesome5 name="money-bill-wave" size={24} color="#2196F3" />
      case "bank_transfer":
        return <MaterialCommunityIcons name="bank" size={24} color="#3F51B5" />
      default:
        return <Ionicons name="card" size={24} color="#9E9E9E" />
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>
            {isWalletTopUp ? t("payment.topUpWallet") : t("payment.paymentMethods")}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{isWalletTopUp ? t("payment.topUpWallet") : t("payment.paymentMethods")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.amountCard}>
          <Card.Content>
            <Text style={styles.amountLabel}>
              {isWalletTopUp ? t("payment.topUpAmount") : t("payment.amountToPay")}
            </Text>
            <Text style={styles.amountValue}>{amount.toLocaleString()} FCFA</Text>
          </Card.Content>
        </Card>

        <Text style={styles.sectionTitle}>{t("payment.selectMethod")}</Text>

        <Card style={styles.methodsCard}>
          <Card.Content>
            <RadioButton.Group onValueChange={(value) => setSelectedMethod(value)} value={selectedMethod}>
              {paymentMethods.map((method, index) => (
                <React.Fragment key={method.id}>
                  <TouchableOpacity
                    style={[styles.methodOption, !method.enabled && styles.disabledMethod]}
                    onPress={() => method.enabled && setSelectedMethod(method.id)}
                    disabled={!method.enabled || processing}
                  >
                    <View style={styles.methodInfo}>
                      <View style={styles.methodIconContainer}>{getPaymentMethodIcon(method.id)}</View>
                      <View style={styles.methodTextContainer}>
                        <Text style={styles.methodName}>{method.name}</Text>
                        {!method.enabled && <Text style={styles.methodDisabledText}>{t("payment.unavailable")}</Text>}
                      </View>
                    </View>
                    <RadioButton value={method.id} disabled={!method.enabled || processing} />
                  </TouchableOpacity>
                  {index < paymentMethods.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {["orange_money", "mtn_money", "moov_money"].includes(selectedMethod) && (
          <Card style={styles.phoneCard}>
            <Card.Content>
              <Text style={styles.phoneLabel}>{t("payment.enterPhoneNumber")}</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.phonePrefix}>+225</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="XX XX XX XX XX"
                  keyboardType="phone-pad"
                  maxLength={10}
                  editable={!processing}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          mode="contained"
          style={styles.payButton}
          labelStyle={styles.payButtonLabel}
          onPress={handlePayment}
          loading={processing}
          disabled={!selectedMethod || processing}
        >
          {isWalletTopUp ? t("payment.topUp") : t("payment.pay")}
        </Button>
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
  scrollContent: {
    padding: 16,
  },
  amountCard: {
    marginBottom: 16,
    backgroundColor: "#E8F5E9",
  },
  amountLabel: {
    fontSize: 14,
    color: "#2E7D32",
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  methodsCard: {
    marginBottom: 16,
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  disabledMethod: {
    opacity: 0.5,
  },
  methodInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  methodDisabledText: {
    fontSize: 12,
    color: "#F44336",
  },
  divider: {
    marginVertical: 4,
  },
  phoneCard: {
    marginBottom: 16,
  },
  phoneLabel: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 4,
    paddingHorizontal: 12,
  },
  phonePrefix: {
    fontSize: 16,
    color: "#212121",
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    paddingVertical: 12,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: "#C62828",
    fontSize: 14,
  },
  payButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
    marginTop: 8,
  },
  payButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
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
})

export default PaymentMethodsScreen
