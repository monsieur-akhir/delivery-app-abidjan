"use client"

import React, { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, Alert } from "react-native"
import { Text, Card, Switch, Button, Divider, List, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { Feather } from "@expo/vector-icons"
import { useTranslation } from "react-i18next"
// Removed unused import
import { useUser } from "../../hooks"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { UserPreferences, NotificationSettings } from "../../types/models"

type UserPreferencesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>
}

const UserPreferencesScreen: React.FC<UserPreferencesScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  // Remove unused user variable
  const { getUserPreferences, updateUserPreferences, getNotificationSettings, updateNotificationSettings } = useUser()
  const userState = useUser()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null)

  const loadUserPreferences = useCallback(async () => {
    try {
      setLoading(true)
      // Call getUserPreferences function
      await getUserPreferences()
      // Get notification settings
      const notifData = await getNotificationSettings()
      
      // Use the current state from userState
      if (userState.preferences) {
        setPreferences(userState.preferences)
      }
      
      if (notifData) {
        setNotifications(notifData)
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
      Alert.alert(t('common.error'), t('preferences.loadError'))
    } finally {
      setLoading(false)
    }
  }, [getUserPreferences, getNotificationSettings, userState.preferences, t])

  useEffect(() => {
    loadUserPreferences()
  }, [loadUserPreferences])

  const handlePreferenceUpdate = async (key: keyof UserPreferences, value: boolean | string | number) => {
    if (!preferences) return

    try {
      setSaving(true)
      const updatedPreferences = { ...preferences, [key]: value }
      await updateUserPreferences(updatedPreferences)
      setPreferences(updatedPreferences)
    } catch (error) {
      console.error('Error updating preference:', error)
      Alert.alert(t('common.error'), t('preferences.updateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
    if (!notifications) return

    try {
      setSaving(true)
      const updatedNotifications = { ...notifications, [key]: value }
      await updateNotificationSettings(updatedNotifications)
      setNotifications(updatedNotifications)
    } catch (error) {
      console.error('Error updating notification:', error)
      Alert.alert(t('common.error'), t('preferences.notificationUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            icon={() => <Feather name="arrow-left" size={24} color="#212121" />}
          >
            {t('common.back')}
          </Button>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('preferences.loading')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          icon={() => <Feather name="arrow-left" size={24} color="#212121" />}
        >
          {t('common.back')}
        </Button>
        <Text style={styles.headerTitle}>{t('preferences.title')}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Préférences de livraison */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('preferences.delivery.title')}</Text>
            
            <List.Item
              title={t('preferences.delivery.autoAcceptBids')}
              description={t('preferences.delivery.autoAcceptBidsDesc')}
              left={props => <List.Icon {...props} icon="check-circle" />}
              right={() => (
                <Switch
                  value={preferences?.auto_accept_bids || false}
                  onValueChange={(value) => handlePreferenceUpdate('auto_accept_bids', value)}
                  disabled={saving}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title={t('preferences.delivery.prioritizeNearby')}
              description={t('preferences.delivery.prioritizeNearbyDesc')}
              left={props => <List.Icon {...props} icon="map-marker" />}
              right={() => (
                <Switch
                  value={preferences?.prioritize_nearby_couriers || false}
                  onValueChange={(value) => handlePreferenceUpdate('prioritize_nearby_couriers', value)}
                  disabled={saving}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title={t('preferences.delivery.allowExpressDelivery')}
              description={t('preferences.delivery.allowExpressDeliveryDesc')}
              left={props => <List.Icon {...props} icon="clock-fast" />}
              right={() => (
                <Switch
                  value={preferences?.allow_express_delivery || false}
                  onValueChange={(value) => handlePreferenceUpdate('allow_express_delivery', value)}
                  disabled={saving}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Préférences de communication */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('preferences.communication.title')}</Text>
            
            <List.Item
              title={t('preferences.communication.allowCourierCalls')}
              description={t('preferences.communication.allowCourierCallsDesc')}
              left={props => <List.Icon {...props} icon="phone" />}
              right={() => (
                <Switch
                  value={preferences?.allow_courier_calls || false}
                  onValueChange={(value) => handlePreferenceUpdate('allow_courier_calls', value)}
                  disabled={saving}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title={t('preferences.communication.allowCourierMessages')}
              description={t('preferences.communication.allowCourierMessagesDesc')}
              left={props => <List.Icon {...props} icon="message" />}
              right={() => (
                <Switch
                  value={preferences?.allow_courier_messages || false}
                  onValueChange={(value) => handlePreferenceUpdate('allow_courier_messages', value)}
                  disabled={saving}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('preferences.notifications.title')}</Text>
            
            <List.Item
              title={t('preferences.notifications.bidReceived')}
              description={t('preferences.notifications.bidReceivedDesc')}
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notifications?.bid_notifications || false}
                  onValueChange={(value) => handleNotificationUpdate('bid_notifications', value)}
                  disabled={saving}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title={t('preferences.notifications.deliveryStatus')}
              description={t('preferences.notifications.deliveryStatusDesc')}
              left={props => <List.Icon {...props} icon="truck" />}
              right={() => (
                <Switch
                  value={notifications?.delivery_notifications || false}
                  onValueChange={(value) => handleNotificationUpdate('delivery_notifications', value)}
                  disabled={saving}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title={t('preferences.notifications.promotions')}
              description={t('preferences.notifications.promotionsDesc')}
              left={props => <List.Icon {...props} icon="gift" />}
              right={() => (
                <Switch
                  value={notifications?.promotional_offers || false}
                  onValueChange={(value) => handleNotificationUpdate('promotional_offers', value)}
                  disabled={saving}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('preferences.actions.title')}</Text>
              <Button
              mode="outlined"
              onPress={() => navigation.navigate('KYCVerification')}
              style={styles.actionButton}
              icon="shield-check"
            >
              {t('preferences.actions.verifyIdentity')}
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('PaymentMethods')}
              style={styles.actionButton}
              icon="credit-card"
            >
              {t('preferences.actions.paymentMethods')}
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('PrivacySettings')}
              style={styles.actionButton}
              icon="lock"
            >
              {t('preferences.actions.privacySettings')}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#212121',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  actionButton: {
    marginVertical: 8,
  },
})

export default UserPreferencesScreen
