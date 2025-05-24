"use client"

import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native"
import { Text, Card, Button, IconButton, Divider, List } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../types/navigation"
import OfflineService, { type SyncStatus } from "../services/OfflineService"
import { useNetwork } from "../contexts/NetworkContext"
import { formatDate } from "../utils/formatters"

const OfflineManagerScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { t } = useTranslation()
  const { isConnected, pendingUploads, pendingDownloads, synchronizeData } = useNetwork()

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTime: null,
    pendingUploads: 0,
    pendingDownloads: 0,
    syncInProgress: false,
  })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [preloading, setPreloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const status = await OfflineService.getSyncStatus()
      setSyncStatus({
        ...status,
        pendingUploads: pendingUploads.length,
        pendingDownloads: pendingDownloads.length,
      })
    } catch (err) {
      console.error("Error loading offline data:", err)
      setError(t("offline.errorLoadingData"))
    } finally {
      setLoading(false)
    }
  }, [pendingUploads, pendingDownloads, t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSync = async () => {
    if (!isConnected) {
      Alert.alert(t("offline.error"), t("offline.needConnectionToSync"))
      return
    }

    try {
      setSyncing(true)
      setError(null)
      const success = await synchronizeData()

      if (success) {
        // Mettre à jour le statut après synchronisation
        const newStatus = await OfflineService.getSyncStatus()
        setSyncStatus(newStatus)
        Alert.alert(t("offline.success"), t("offline.syncCompleted"))
      } else {
        throw new Error(t("offline.syncFailed"))
      }
    } catch (err) {
      console.error("Error syncing data:", err)
      setError(t("offline.syncError"))
      Alert.alert(t("offline.error"), t("offline.syncError"))
    } finally {
      setSyncing(false)
    }
  }

  const handlePreloadData = async () => {
    if (!isConnected) {
      Alert.alert(t("offline.error"), t("offline.needConnectionToPreload"))
      return
    }

    try {
      setPreloading(true)
      setError(null)

      // Liste des endpoints à précharger
      const endpoints = [
        "/user/profile",
        "/deliveries/active",
        "/deliveries/history?limit=20",
        "/notifications?limit=20",
        "/market/nearby",
        "/wallet/balance",
      ]

      const successCount = await OfflineService.preloadData(endpoints)

      Alert.alert(
        t("offline.preloadComplete"),
        t("offline.preloadedItems", { count: successCount, total: endpoints.length }),
      )

      // Mettre à jour le statut après préchargement
      loadData()
    } catch (err) {
      console.error("Error preloading data:", err)
      setError(t("offline.preloadError"))
      Alert.alert(t("offline.error"), t("offline.preloadError"))
    } finally {
      setPreloading(false)
    }
  }

  const handleClearCache = () => {
    Alert.alert(t("offline.clearCacheTitle"), t("offline.clearCacheConfirmation"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: async () => {
          try {
            await OfflineService.clearCache()
            Alert.alert(t("offline.success"), t("offline.cacheCleared"))
          } catch (err) {
            console.error("Error clearing cache:", err)
            Alert.alert(t("offline.error"), t("offline.clearCacheError"))
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{t("offline.manager")}</Text>
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
        <Text style={styles.headerTitle}>{t("offline.manager")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Statut de connexion */}
        <Card style={[styles.statusCard, isConnected ? styles.onlineCard : styles.offlineCard]}>
          <Card.Content style={styles.statusCardContent}>
            <IconButton icon={isConnected ? "wifi" : "wifi-off"} size={32} iconColor="#FFFFFF" style={styles.statusIcon} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>{isConnected ? t("offline.online") : t("offline.offline")}</Text>
              <Text style={styles.statusDescription}>
                {isConnected ? t("offline.onlineDescription") : t("offline.offlineDescription")}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Statut de synchronisation */}
        <Card style={styles.syncCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("offline.syncStatus")}</Text>

            <View style={styles.syncInfoContainer}>
              <View style={styles.syncInfoItem}>
                <Text style={styles.syncInfoLabel}>{t("offline.lastSync")}</Text>
                <Text style={styles.syncInfoValue}>
                  {syncStatus.lastSyncTime ? formatDate(syncStatus.lastSyncTime) : t("offline.never")}
                </Text>
              </View>

              <View style={styles.syncInfoItem}>
                <Text style={styles.syncInfoLabel}>{t("offline.pendingUploads")}</Text>
                <Text style={styles.syncInfoValue}>{syncStatus.pendingUploads}</Text>
              </View>

              <View style={styles.syncInfoItem}>
                <Text style={styles.syncInfoLabel}>{t("offline.pendingDownloads")}</Text>
                <Text style={styles.syncInfoValue}>{syncStatus.pendingDownloads}</Text>
              </View>
            </View>

            <Button
              mode="contained"
              style={styles.syncButton}
              labelStyle={styles.buttonLabel}
              onPress={handleSync}
              loading={syncing}
              disabled={syncing || !isConnected}
              icon="sync"
            >
              {t("offline.syncNow")}
            </Button>
          </Card.Content>
        </Card>

        {/* Gestion des données hors ligne */}
        <Card style={styles.dataCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("offline.offlineData")}</Text>

            <List.Item
              title={t("offline.preloadData")}
              description={t("offline.preloadDataDescription")}
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) =>
                preloading ? (
                  <ActivityIndicator size="small" color="#FF6B00" />
                ) : (
                  <IconButton {...props} icon="chevron-right" size={24} onPress={handlePreloadData} disabled={!isConnected} />
                )
              }
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("offline.clearCache")}
              description={t("offline.clearCacheDescription")}
              left={(props) => <List.Icon {...props} icon="delete" />}
              right={(props) => <IconButton {...props} icon="chevron-right" size={24} onPress={handleClearCache} />}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("offline.manageStorage")}
              description={t("offline.manageStorageDescription")}
              left={(props) => <List.Icon {...props} icon="folder" />}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="chevron-right"
                  size={24}
                  onPress={() => navigation.navigate("StorageManagementScreen")}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Paramètres hors ligne */}
        <Card style={styles.settingsCard}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t("offline.offlineSettings")}</Text>

            <List.Item
              title={t("offline.autoSync")}
              description={t("offline.autoSyncDescription")}
              left={(props) => <List.Icon {...props} icon="sync" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigation vers les paramètres de synchronisation automatique
                navigation.navigate("AutoSyncSettingsScreen")
              }}
            />

            <Divider style={styles.divider} />

            <List.Item
              title={t("offline.dataUsage")}
              description={t("offline.dataUsageDescription")}
              left={(props) => <List.Icon {...props} icon="chart-bar" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                // Navigation vers les paramètres d'utilisation des données
                navigation.navigate("DataUsageSettingsScreen")
              }}
            />
          </Card.Content>
        </Card>

        {error && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text style={styles.errorText}>{error}</Text>
            </Card.Content>
          </Card>
        )}
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
    paddingBottom: 32,
  },
  statusCard: {
    marginBottom: 16,
  },
  onlineCard: {
    backgroundColor: "#4CAF50",
  },
  offlineCard: {
    backgroundColor: "#F44336",
  },
  statusCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    margin: 0,
  },
  statusTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: "#FFFFFF",
  },
  syncCard: {
    marginBottom: 16,
  },
  dataCard: {
    marginBottom: 16,
  },
  settingsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  syncInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  syncInfoItem: {
    width: "48%",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  syncInfoLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  syncInfoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  syncButton: {
    backgroundColor: "#FF6B00",
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  divider: {
    marginVertical: 8,
  },
  errorCard: {
    backgroundColor: "#FFEBEE",
  },
  errorText: {
    color: "#C62828",
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

export default OfflineManagerScreen
