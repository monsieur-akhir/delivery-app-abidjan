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
        setProfile({
          user_id: user.id,
          full_name: user.full_name,
          phone: user.phone,
          city: user.commune || "",
          country: "Côte d'Ivoire",
          address: user.commune || "",
          email: user.email || "",
          role: user.role,
          // language_preference managed separately
          vehicle_type: user.role === 'courier' ? 'motorcycle' : undefined,
          license_plate: "",
          business_name: "",
          business_address: "",
        })
        setEditedProfile({
          user_id: user.id,
          full_name: user.full_name,
          phone: user.phone,
          city: user.commune || "",
          country: "Côte d'Ivoire",
          address: user.commune || "",
          email: user.email || "",
          role: user.role,
          // language_preference managed separately
          vehicle_type: user.role === 'courier' ? 'motorcycle' : undefined,
          license_plate: "",
          business_name: "",
          business_address: "",
        })
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
        // Mettre à jour le profil en ligne
        const updatedUser = await updateUserProfile(editedProfile as Partial<User>)
        // Convert User to UserProfile
        setProfile({
          user_id: updatedUser.id,
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          city: updatedUser.commune || "",
          country: "Côte d'Ivoire",
          address: updatedUser.commune || "",
          email: updatedUser.email || "",
          role: updatedUser.role,
          // language_preference managed separately
          vehicle_type: updatedUser.role === 'courier' ? 'motorcycle' : undefined,
          license_plate: "",
          business_name: "",
          business_address: "",
        })
        updateUserData(updatedUser)
      } else {
        // Stocker pour synchronisation ultérieure
        addPendingUpload({
          type: "profile_update",
          data: editedProfile,
          retries: 0
        })

        // Mettre à jour localement
        setProfile((prev) => ({ ...prev, ...editedProfile }) as UserProfile)
        updateUserData(editedProfile as Partial<User>)

        Alert.alert(t("profile.offlineUpdateSaved"), t("profile.offlineUpdateSavedMessage"))
      }

      setEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      Alert.alert(t("profile.error"), t("profile.errorUpdatingProfile"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>{t("profile.loading")}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        {!editing ? (
          <TouchableOpacity onPress={handleEdit}>
            <IconButton icon="pencil" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B00"]} />}
      >
        <View style={styles.profileImageContainer}>
          {uploadingImage ? (
            <ActivityIndicator size="large" color="#FF6B00" style={styles.uploadingIndicator} />
          ) : profile?.profile_picture ? (
            <Avatar.Image source={{ uri: profile.profile_picture }} size={120} />
          ) : (
            <Avatar.Icon size={120} icon="account" style={{ backgroundColor: "#FF6B00" }} />
          )}

          <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage} disabled={uploadingImage}>
            <Text style={styles.changePhotoText}>{t("profile.changePhoto")}</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.fullName")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.full_name || ""}
                  onChangeText={(value) => handleChange("full_name", value)}
                  style={styles.editInput}
                  mode="outlined"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.full_name}</Text>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.phone")}</Text>
              <Text style={styles.infoValue}>{profile?.phone}</Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.email")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.email || ""}
                  onChangeText={(value) => handleChange("email", value)}
                  style={styles.editInput}
                  mode="outlined"
                  keyboardType="email-address"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.email || t("profile.notProvided")}</Text>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.role")}</Text>
              <Text style={styles.infoValue}>
                {profile?.role === "client"
                  ? t("roles.client")
                  : profile?.role === "courier"
                    ? t("roles.courier")
                    : profile?.role === "business"
                      ? t("roles.business")
                      : profile?.role}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.commune")}</Text>
              {editing ? (
                <TextInput
                  value={editedProfile.address || ""}
                  onChangeText={(value) => handleChange("address", value)}
                  style={styles.editInput}
                  mode="outlined"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.address || t("profile.notProvided")}</Text>
              )}
            </View>

            {profile?.role === "courier" && (
              <>
                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("profile.vehicleType")}</Text>
                  {editing ? (
                    <TextInput
                      value={editedProfile.vehicle_type || ""}
                      onChangeText={(value) => handleChange("vehicle_type", value)}
                      style={styles.editInput}
                      mode="outlined"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.vehicle_type || t("profile.notProvided")}</Text>
                  )}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("profile.licensePlate")}</Text>
                  {editing ? (
                    <TextInput
                      value={editedProfile.license_plate || ""}
                      onChangeText={(value) => handleChange("license_plate", value)}
                      style={styles.editInput}
                      mode="outlined"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.license_plate || t("profile.notProvided")}</Text>
                  )}
                </View>
              </>
            )}

            {profile?.role === "business" && (
              <>
                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("profile.businessName")}</Text>
                  {editing ? (
                    <TextInput
                      value={editedProfile.business_name || ""}
                      onChangeText={(value) => handleChange("business_name", value)}
                      style={styles.editInput}
                      mode="outlined"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.business_name || t("profile.notProvided")}</Text>
                  )}
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t("profile.businessAddress")}</Text>
                  {editing ? (
                    <TextInput
                      value={editedProfile.business_address || ""}
                      onChangeText={(value) => handleChange("business_address", value)}
                      style={styles.editInput}
                      mode="outlined"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.business_address || t("profile.notProvided")}</Text>
                  )}
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t("profile.memberSince")}</Text>
              <Text style={styles.infoValue}>
                {profile ? new Date().toLocaleDateString() : "-"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {editing && (
          <View style={styles.editButtonsContainer}>
            <Button mode="outlined" onPress={handleCancel} style={styles.cancelButton} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button mode="contained" onPress={handleSave} style={styles.saveButton} loading={saving} disabled={saving}>
              {t("common.save")}
            </Button>
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => navigation.navigate("Settings")}
          style={styles.settingsButton}
          icon="cog"
        >
          {t("profile.settings")}
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
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  uploadingIndicator: {
    marginVertical: 40,
  },
  changePhotoButton: {
    marginTop: 12,
  },
  changePhotoText: {
    color: "#FF6B00",
    fontSize: 14,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoRow: {
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#212121",
  },
  divider: {
    marginVertical: 8,
  },
  editInput: {
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#757575",
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
  },
  settingsButton: {
    backgroundColor: "#212121",
    marginBottom: 20,
  },
})

export default ProfileScreen