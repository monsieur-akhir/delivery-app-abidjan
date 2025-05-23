"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { Text, Card, Avatar, Button, Divider, List, Switch, IconButton, ActivityIndicator } from "react-native-paper"
import * as ImagePicker from "expo-image-picker"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { useTheme } from "../../contexts/ThemeContext"
import { getUserProfile, updateUserProfile, uploadProfilePicture } from "../../services/api"
import { formatPhoneNumber } from "../../utils/formatters"

const ProfileScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation()
  const { user, updateUserData, signOut } = useAuth()
  const { isConnected, isOfflineMode, toggleOfflineMode } = useNetwork()
  const { isDarkMode, toggleTheme } = useTheme()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const profileData = await getUserProfile()
      setProfile(profileData)
    } catch (error) {
      console.error("Error loading profile:", error)
      // Utiliser les données locales en cas d'erreur
      setProfile(user)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }

  const handlePickImage = async () => {
    if (!isConnected && !isOfflineMode) {
      Alert.alert(t("profile.offlineTitle"), t("profile.offlineImageUpload"))
      return
    }

    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t("profile.permissionDenied"), t("profile.cameraRollPermission"))
        return
      }

      // Lancer le sélecteur d'image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Qualité réduite pour économiser les données
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0]

        // Vérifier la taille de l'image (limite à 2MB)
        const fileInfo = await fetch(selectedImage.uri).then((res) => res.blob())
        if (fileInfo.size > 2 * 1024 * 1024) {
          Alert.alert(t("profile.imageTooLarge"), t("profile.imageSizeLimit"))
          return
        }

        setUploadingImage(true)

        // Créer un objet FormData pour l'upload
        const formData = new FormData()
        formData.append("file", {
          uri: selectedImage.uri,
          type: "image/jpeg",
          name: "profile-picture.jpg",
        })

        // Uploader l'image
        const updatedUser = await uploadProfilePicture(formData)

        // Mettre à jour le profil local
        setProfile(updatedUser)
        updateUserData(updatedUser)

        Alert.alert(t("profile.success"), t("profile.profilePictureUpdated"))
      }
    } catch (error) {
      console.error("Error picking/uploading image:", error)
      Alert.alert(t("profile.error"), t("profile.errorUploadingImage"))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleLanguageChange = async (language) => {
    try {
      i18n.changeLanguage(language)

      if (isConnected) {
        // Mettre à jour la préférence de langue sur le serveur
        const updatedUser = await updateUserProfile({
          language_preference: language,
        })

        setProfile(updatedUser)
        updateUserData(updatedUser)
      }
    } catch (error) {
      console.error("Error changing language:", error)
    }
  }

  const handleLogout = () => {
    Alert.alert(t("profile.logoutTitle"), t("profile.logoutConfirm"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.confirm"),
        onPress: () => signOut(),
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
    >
      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickImage} disabled={uploadingImage}>
            {uploadingImage ? (
              <View style={styles.avatarContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.uploadingIndicator} />
              </View>
            ) : (
              <Avatar.Image
                size={80}
                source={
                  profile?.profile_picture
                    ? { uri: profile.profile_picture }
                    : require("../../assets/default-avatar.png")
                }
                style={styles.avatar}
              />
            )}
            <View style={styles.editIconContainer}>
              <IconButton icon="camera" size={16} color="#FFFFFF" style={styles.editIcon} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name}</Text>
            <Text style={styles.profilePhone}>{formatPhoneNumber(profile?.phone)}</Text>
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}>
                {profile?.role === "client"
                  ? t("roles.client")
                  : profile?.role === "courier"
                    ? t("roles.courier")
                    : profile?.role === "business"
                      ? t("roles.business")
                      : ""}
              </Text>
            </View>
          </View>
        </View>

        <Card.Actions style={styles.profileActions}>
          <Button
            mode="outlined"
            icon="account-edit"
            onPress={() => navigation.navigate("EditProfile")}
            style={styles.actionButton}
          >
            {t("profile.editProfile")}
          </Button>

          {profile?.role === "courier" && (
            <Button
              mode="outlined"
              icon="certificate"
              onPress={() => navigation.navigate("CourierProfile")}
              style={styles.actionButton}
            >
              {t("profile.courierProfile")}
            </Button>
          )}

          {profile?.role === "business" && (
            <Button
              mode="outlined"
              icon="store"
              onPress={() => navigation.navigate("BusinessProfile")}
              style={styles.actionButton}
            >
              {t("profile.businessProfile")}
            </Button>
          )}
        </Card.Actions>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title={t("profile.accountSettings")} />
        <Card.Content>
          <List.Item
            title={t("profile.notifications")}
            description={t("profile.notificationsDesc")}
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("NotificationSettings")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.language")}
            description={t("languages." + i18n.language)}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("LanguageSettings")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.darkMode")}
            description={t("profile.darkModeDesc")}
            left={(props) => <List.Icon {...props} icon={isDarkMode ? "weather-night" : "weather-sunny"} />}
            right={(props) => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.offlineMode")}
            description={t("profile.offlineModeDesc")}
            left={(props) => <List.Icon {...props} icon="wifi-off" />}
            right={(props) => <Switch value={isOfflineMode} onValueChange={toggleOfflineMode} />}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.security")}
            description={t("profile.securityDesc")}
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("SecuritySettings")} />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title={t("profile.appSettings")} />
        <Card.Content>
          <List.Item
            title={t("profile.wallet")}
            description={t("profile.walletDesc")}
            left={(props) => <List.Icon {...props} icon="wallet" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("Wallet")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.deliveryHistory")}
            description={t("profile.deliveryHistoryDesc")}
            left={(props) => <List.Icon {...props} icon="history" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("DeliveryHistory")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.savedAddresses")}
            description={t("profile.savedAddressesDesc")}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("SavedAddresses")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.help")}
            description={t("profile.helpDesc")}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("Help")} />
            )}
          />
        </Card.Content>
      </Card>

      <Card style={styles.sectionCard}>
        <Card.Title title={t("profile.about")} />
        <Card.Content>
          <List.Item
            title={t("profile.aboutApp")}
            description={t("profile.aboutAppDesc")}
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("About")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.termsConditions")}
            description={t("profile.termsConditionsDesc")}
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("Terms")} />
            )}
          />

          <Divider style={styles.divider} />

          <List.Item
            title={t("profile.privacyPolicy")}
            description={t("profile.privacyPolicyDesc")}
            left={(props) => <List.Icon {...props} icon="shield" />}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" onPress={() => navigation.navigate("Privacy")} />
            )}
          />
        </Card.Content>
      </Card>

      <Button mode="outlined" icon="logout" onPress={handleLogout} style={styles.logoutButton} color="#F44336">
        {t("profile.logout")}
      </Button>

      <Text style={styles.versionText}>{t("profile.version")} 1.0.0</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#E0E0E0",
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingIndicator: {
    position: "absolute",
  },
  editIconContainer: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#FF6B00",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    margin: 0,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profilePhone: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  roleContainer: {
    backgroundColor: "#FF6B00",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  roleText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  profileActions: {
    justifyContent: "space-around",
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  divider: {
    marginVertical: 8,
  },
  logoutButton: {
    margin: 16,
    borderColor: "#F44336",
  },
  versionText: {
    textAlign: "center",
    color: "#9E9E9E",
    marginBottom: 24,
  },
})

export default ProfileScreen
