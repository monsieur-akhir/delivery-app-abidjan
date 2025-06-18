"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { Text, Card, Button, Avatar, TextInput, Divider, IconButton, ActivityIndicator } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { getUserProfile, updateUserProfile, uploadProfileImage } from "../../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { UserProfile, User } from "../../types/models"

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Profile">
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { user, updateUserData } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({})
  const [saving, setSaving] = useState<boolean>(false)

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const profileData = await getUserProfile()
      // Convert User to UserProfile by adding user_id and ensuring required fields
      const userProfile: UserProfile = {
        user_id: typeof profileData.id === 'number' ? profileData.id : parseInt(profileData.id || '0'),
        address: profileData.address || "",
        city: profileData.city || "",
        country: profileData.country || "",
        phone: profileData.phone,
        email: profileData.email || '',
        role: profileData.role,
        vehicle_type: profileData.vehicle_type,
        license_plate: profileData.license_plate,
        business_name: profileData.business_name,
        business_address: profileData.business_address,
        profile_picture: profileData.profile_picture,
        full_name: profileData.full_name,
      }
      setProfile(userProfile)
      setEditedProfile(userProfile)
    } catch (error) {
      console.error("Error loading profile:", error)
      // Utiliser les données locales en cas d'erreur
      if (user) {
        const fallbackProfile: UserProfile = {
          user_id: user.id,
          full_name: user.full_name,
          phone: user.phone,
          city: user.commune || "",
          country: "Côte d'Ivoire",
          address: user.commune || "",
          email: user.email || "",
          role: user.role,
          vehicle_type: user.role === 'courier' ? 'motorcycle' : undefined,
          license_plate: "",
          business_name: "",
          business_address: "",
          profile_picture: user.profile_picture,
        }
        setProfile(fallbackProfile)
        setEditedProfile(fallbackProfile)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true)
    await loadProfile()
    setRefreshing(false)
  }

  const handlePickImage = async (): Promise<void> => {
    if (!isConnected) {
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
        uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert(t("profile.error"), t("profile.errorPickingImage"))
    }
  }

  const uploadImage = async (uri: string): Promise<void> => {
    try {
      setUploadingImage(true)

      if (isConnected) {
        // Create FormData from URI
        const formData = new FormData()
        // React Native FormData expects this specific format for file uploads
        formData.append("file", {
          uri: uri,
          type: "image/jpeg",
          name: "profile-picture.jpg",
        } as unknown as Blob)

        // Télécharger l'image
        const response = await uploadProfileImage(formData)

        // Mettre à jour le profil avec la nouvelle URL d'image
        if (response && response.image_url) {
          const updatedProfile: UserProfile = { 
            ...profile,
            profile_picture: response.image_url 
          } as UserProfile
          setProfile(updatedProfile)
          setEditedProfile(updatedProfile)
          updateUserData({ profile_picture: response.image_url })
        }
      } else {
        // Stocker pour synchronisation ultérieure
        addPendingUpload({
          type: "profile_image",
          data: { uri },
          retries: 0
        })

        Alert.alert(t("profile.offlineImageSaved"), t("profile.offlineImageSavedMessage"))
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      Alert.alert(t("profile.error"), t("profile.errorUploadingImage"))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleEdit = (): void => {
    setEditing(true)
  }

  const handleCancel = (): void => {
    setEditing(false)
    setEditedProfile(profile || {})
  }

  const handleChange = (field: keyof UserProfile, value: string): void => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true)

      if (isConnected) {
        await updateUserProfile(editedProfile)
        setProfile(editedProfile as UserProfile)
        updateUserData(editedProfile)
        setEditing(false)
        Alert.alert(t("profile.success"), t("profile.profileUpdated"))
      } else {
        // Stocker pour synchronisation ultérieure
        addPendingUpload({
          type: "profile_update",
          data: editedProfile,
          retries: 0
        })
        setEditing(false)
        Alert.alert(t("profile.offlineSaved"), t("profile.offlineSavedMessage"))
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      Alert.alert(t("profile.error"), t("profile.errorSavingProfile"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{t("profile.errorLoadingProfile")}</Text>
        <Button mode="contained" onPress={loadProfile}>
          {t("common.retry")}
        </Button>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <View style={styles.headerRight}>
          {editing ? (
            <>
              <IconButton
                icon="check"
                size={24}
                onPress={handleSave}
                disabled={saving}
              />
              <IconButton
                icon="close"
                size={24}
                onPress={handleCancel}
                disabled={saving}
              />
            </>
          ) : (
            <IconButton
              icon="pencil"
              size={24}
              onPress={handleEdit}
            />
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Picture Section */}
        <Card style={styles.profileCard}>
          <View style={styles.profilePictureContainer}>
            <Avatar.Image
              size={100}
              source={
                profile.profile_picture
                  ? { uri: profile.profile_picture }
                  : require("../../assets/default-avatar.png")
              }
            />
            {!editing && (
              <TouchableOpacity
                style={styles.editPictureButton}
                onPress={handlePickImage}
                disabled={uploadingImage}
              >
                <IconButton
                  icon="camera"
                  size={20}
                  iconColor="#FFFFFF"
                  style={styles.cameraIcon}
                />
              </TouchableOpacity>
            )}
            {uploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>
        </Card>

        {/* Profile Information */}
        <Card style={styles.infoCard}>
          <Card.Title title={t("profile.personalInfo")} />
          <Card.Content>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t("profile.fullName")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.full_name || ""}
                  onChangeText={(text) => handleChange("full_name", text)}
                  style={styles.textInput}
                  mode="outlined"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.full_name}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t("profile.phone")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.phone || ""}
                  onChangeText={(text) => handleChange("phone", text)}
                  style={styles.textInput}
                  mode="outlined"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.phone}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t("profile.email")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.email || ""}
                  onChangeText={(text) => handleChange("email", text)}
                  style={styles.textInput}
                  mode="outlined"
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.email}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t("profile.address")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.address || ""}
                  onChangeText={(text) => handleChange("address", text)}
                  style={styles.textInput}
                  mode="outlined"
                  multiline
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.address}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{t("profile.city")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.city || ""}
                  onChangeText={(text) => handleChange("city", text)}
                  style={styles.textInput}
                  mode="outlined"
                />
              ) : (
                <Text style={styles.fieldValue}>{profile.city}</Text>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Courier Specific Information */}
        {user?.role === 'courier' && (
          <Card style={styles.infoCard}>
            <Card.Title title={t("profile.vehicleInfo")} />
            <Card.Content>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{t("profile.vehicleType")}</Text>
                {editing ? (
                  <TextInput
                    value={editedProfile.vehicle_type || ""}
                    onChangeText={(text) => handleChange("vehicle_type", text)}
                    style={styles.textInput}
                    mode="outlined"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.vehicle_type}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{t("profile.licensePlate")}</Text>
                {editing ? (
                  <TextInput
                    value={editedProfile.license_plate || ""}
                    onChangeText={(text) => handleChange("license_plate", text)}
                    style={styles.textInput}
                    mode="outlined"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.license_plate}</Text>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Business Information for Clients */}
        {user?.role === 'client' && (
          <Card style={styles.infoCard}>
            <Card.Title title={t("profile.businessInfo")} />
            <Card.Content>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{t("profile.businessName")}</Text>
                {editing ? (
                  <TextInput
                    value={editedProfile.business_name || ""}
                    onChangeText={(text) => handleChange("business_name", text)}
                    style={styles.textInput}
                    mode="outlined"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.business_name}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{t("profile.businessAddress")}</Text>
                {editing ? (
                  <TextInput
                    value={editedProfile.business_address || ""}
                    onChangeText={(text) => handleChange("business_address", text)}
                    style={styles.textInput}
                    mode="outlined"
                    multiline
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile.business_address}</Text>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Settings")}
            style={styles.actionButton}
            icon="cog"
          >
            {t("profile.settings")}
          </Button>

          {user?.role === 'courier' && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("VehicleManagement")}
              style={styles.actionButton}
              icon="truck"
            >
              {t("profile.manageVehicles")}
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 16,
    elevation: 2,
  },
  profilePictureContainer: {
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  editPictureButton: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    backgroundColor: "#FF6B00",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraIcon: {
    margin: 0,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#666",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
  },
  actionButtons: {
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    marginBottom: 12,
  },
})

export default ProfileScreen