"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, Animated } from "react-native"
import { Text, Card, Button, Avatar, TextInput, Divider, IconButton, ActivityIndicator, Surface, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import * as ImagePicker from "expo-image-picker"
import { useTranslation } from "react-i18next"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../contexts/AuthContext"
import { useNetwork } from "../../contexts/NetworkContext"
import { getUserProfile, updateUserProfile, uploadProfileImage } from "../../services/api"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../../types/navigation"
import type { UserProfile, User, UserProfileExtended } from "../../types/models"
import { useAlert } from '../../hooks/useAlert'
import { useLoader } from '../../contexts/LoaderContext'

const { width } = Dimensions.get('window')

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Profile">
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { t } = useTranslation()
  const { user, updateUserData, signOut } = useAuth()
  const { isConnected, addPendingUpload } = useNetwork()
  const { showSuccessAlert, showErrorAlert } = useAlert()
  const { showLoader, hideLoader } = useLoader()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfileExtended>>({})
  const [saving, setSaving] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))

  const loadProfile = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const profileData = await getUserProfile()
      setProfile(profileData)
      setEditedProfile(profileData)
      
      // Animation d'apparition
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start()
    } catch (error) {
      console.error("Error loading profile:", error)
      if (user) {
        const fallbackProfile = {
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
          business_name: user.business_name || "",
          business_address: user.business_address || "",
          profile_picture: user.profile_picture,
        }
        setProfile(fallbackProfile)
        setEditedProfile(fallbackProfile)
      }
    } finally {
      setLoading(false)
    }
  }, [user, fadeAnim])

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
      showErrorAlert(t("profile.offlineTitle"), t("profile.offlineImageUpload"))
      return
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== "granted") {
        showErrorAlert(t("profile.permissionDenied"), t("profile.cameraRollPermission"))
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error picking image:", error)
      showErrorAlert(t("profile.error"), t("profile.errorPickingImage"))
    }
  }

  const uploadImage = async (uri: string): Promise<void> => {
    try {
      setUploadingImage(true)
      showLoader("Mise à jour de la photo...")

      if (isConnected) {
        const formData = new FormData()
        formData.append("file", {
          uri: uri,
          type: "image/jpeg",
          name: "profile-picture.jpg",
        } as unknown as Blob)

        const response = await uploadProfileImage(formData)

        if (response && response.image_url) {
          const updatedProfile: any = { 
            ...profile,
            profile_picture: response.image_url 
          } as UserProfileExtended
          setProfile(updatedProfile)
          setEditedProfile(updatedProfile)
          updateUserData({ profile_picture: response.image_url })
          showSuccessAlert("Succès", "Photo de profil mise à jour")
        }
      } else {
        addPendingUpload({
          type: "profile_image",
          data: { uri },
          retries: 0
        })
        showSuccessAlert(t("profile.offlineImageSaved"), t("profile.offlineImageSavedMessage"))
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      showErrorAlert(t("profile.error"), t("profile.errorUploadingImage"))
    } finally {
      setUploadingImage(false)
      hideLoader()
    }
  }

  const handleEdit = (): void => {
    setEditing(true)
  }

  const handleCancel = (): void => {
    setEditing(false)
    setEditedProfile(profile || {})
  }

  const handleChange = (field: keyof UserProfileExtended, value: string): void => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true)
      showLoader("Sauvegarde en cours...")

      if (isConnected) {
        const updatedUser = await updateUserProfile(editedProfile as Partial<User>)
        const updatedProfile: any = {
          user_id: updatedUser.id,
          full_name: updatedUser.full_name,
          phone: updatedUser.phone,
          email: updatedUser.email || "",
          role: updatedUser.role,
          city: updatedUser.commune || "",
          country: "Côte d'Ivoire",
          address: updatedUser.commune || "",
          vehicle_type: updatedUser.vehicle_type,
          license_plate: "",
          business_name: updatedUser.business_name || "",
          business_address: updatedUser.business_address || "",
          profile_picture: updatedUser.profile_picture,
        }
        setProfile(updatedProfile)
        setEditing(false)
        updateUserData(updatedUser)
        showSuccessAlert(t("profile.success"), t("profile.profileUpdated"))
      } else {
        addPendingUpload({
          type: "profile_update",
          data: editedProfile,
          retries: 0
        })
        showSuccessAlert(t("profile.offlineSaved"), t("profile.offlineSavedMessage"))
        setEditing(false)
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      showErrorAlert(t("profile.error"), t("profile.errorSaving"))
    } finally {
      setSaving(false)
      hideLoader()
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return 'person'
      case 'courier': return 'bicycle'
      case 'business': return 'business'
      default: return 'person'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'client': return '#4CAF50'
      case 'courier': return '#FF9800'
      case 'business': return '#2196F3'
      default: return '#757575'
    }
  }

  const getKYCProps = (profile: any) => {
    const status = profile?.verification_status
    switch (status) {
      case 'verified':
        return { color: '#4CAF50', icon: 'checkmark-circle' as const, label: 'Identité vérifiée' }
      case 'pending':
        return { color: '#FF9800', icon: 'time' as const, label: 'Vérification en cours' }
      case 'rejected':
      case 'expired':
        return { color: '#F44336', icon: 'close-circle' as const, label: 'Non vérifié' }
      default:
        return { color: '#BDBDBD', icon: 'help-circle' as const, label: 'Statut inconnu' }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FF6B00', '#FF8E53']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>{t("profile.loading")}</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#FF6B00', '#FF8E53']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile.title")}</Text>
          {!editing ? (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#FF6B00"]} 
            tintColor="#FF6B00"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Section Photo de profil */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImageWrapper}>
                {uploadingImage ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B00" />
                    <Text style={styles.uploadingText}>Mise à jour...</Text>
                  </View>
                ) : profile?.profile_picture ? (
                  <Avatar.Image 
                    source={{ uri: profile.profile_picture }} 
                    size={120} 
                    style={styles.profileImage}
                  />
                ) : (
                  <Avatar.Icon 
                    size={120} 
                    icon="account" 
                    style={[styles.profileImage, { backgroundColor: "#FF6B00" }]} 
                  />
                )}
                
                <TouchableOpacity 
                  style={styles.cameraButton} 
                  onPress={handlePickImage} 
                  disabled={uploadingImage}
                >
                  <Ionicons name="camera" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.userName}>{profile?.full_name}</Text>
              <View style={[styles.kycBadge, { backgroundColor: getKYCProps(profile).color }]}> 
                <Ionicons name={getKYCProps(profile).icon} size={16} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.kycBadgeText}>{getKYCProps(profile).label}</Text>
              </View>
              <Chip 
                icon={getRoleIcon(profile?.role || '')}
                style={[styles.roleChip, { backgroundColor: getRoleColor(profile?.role || '') }]}
                textStyle={{ color: '#FFFFFF' }}
              >
                {profile?.role === "client" ? t("roles.client") :
                 profile?.role === "courier" ? t("roles.courier") :
                 profile?.role === "business" ? t("roles.business") : profile?.role}
              </Chip>
            </View>
          </View>

          {/* Section Informations personnelles */}
          <Surface style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={20} color="#FF6B00" />
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoRowList}>
                <Ionicons name="call" size={18} color="#FF6B00" style={styles.infoIcon} />
                <Text style={styles.infoValueList}>{profile?.phone || 'Non renseigné'}</Text>
              </View>
              <View style={styles.infoRowList}>
                <Ionicons name="mail" size={18} color="#FF6B00" style={styles.infoIcon} />
                <Text style={styles.infoValueList}>{profile?.email || 'Non renseigné'}</Text>
              </View>
              <View style={styles.infoRowList}>
                <Ionicons name="location" size={18} color="#FF6B00" style={styles.infoIcon} />
                <Text style={styles.infoValueList}>{profile?.commune || profile?.address || 'Non renseigné'}</Text>
              </View>
            </View>
          </Surface>

          {/* Section spécifique au rôle */}
          {profile?.role === "courier" && (
            <Surface style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bicycle" size={20} color="#FF6B00" />
                <Text style={styles.sectionTitle}>Informations coursier</Text>
              </View>

              <View style={styles.infoList}>
                <View style={styles.infoRowList}>
                  <Ionicons name="call" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoValueList}>{profile?.phone || 'Non renseigné'}</Text>
                </View>
                <View style={styles.infoRowList}>
                  <Ionicons name="mail" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoValueList}>{profile?.email || 'Non renseigné'}</Text>
                </View>
                <View style={styles.infoRowList}>
                  <Ionicons name="location" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoValueList}>{profile?.commune || profile?.address || 'Non renseigné'}</Text>
                </View>
              </View>
            </Surface>
          )}

          {profile?.role === "business" && (
            <Surface style={styles.infoSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="business" size={20} color="#FF6B00" />
                <Text style={styles.sectionTitle}>Informations entreprise</Text>
              </View>

              <View style={styles.infoList}>
                <View style={styles.infoRowList}>
                  <Ionicons name="call" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoValueList}>{profile?.phone || 'Non renseigné'}</Text>
                </View>
                <View style={styles.infoRowList}>
                  <Ionicons name="mail" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoValueList}>{profile?.email || 'Non renseigné'}</Text>
                </View>
                <View style={styles.infoRowList}>
                  <Ionicons name="location" size={18} color="#FF6B00" style={styles.infoIcon} />
                  <Text style={styles.infoValueList}>{profile?.commune || profile?.address || 'Non renseigné'}</Text>
                </View>
              </View>
            </Surface>
          )}

          {/* Section Actions */}
          <Surface style={styles.actionsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color="#FF6B00" />
              <Text style={styles.sectionTitle}>Actions</Text>
            </View>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Ionicons name="settings-outline" size={24} color="#FF6B00" />
              <Text style={styles.actionText}>{t("profile.settings")}</Text>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate("Notifications")}
            >
              <Ionicons name="notifications-outline" size={24} color="#FF6B00" />
              <Text style={styles.actionText}>Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </Surface>

          {/* Boutons d'édition */}
          {editing && (
            <View style={styles.editButtonsContainer}>
              <Button 
                mode="outlined" 
                onPress={handleCancel} 
                style={styles.cancelButton} 
                disabled={saving}
                contentStyle={styles.buttonContent}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                mode="contained" 
                onPress={handleSave} 
                style={styles.saveButton} 
                loading={saving} 
                disabled={saving}
                contentStyle={styles.buttonContent}
              >
                {t("common.save")}
              </Button>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionCircle} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings" size={24} color="#FF6B00" />
          <Text style={styles.actionLabel}>Paramètres</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCircle} onPress={() => signOut()}>
          <Ionicons name="log-out" size={24} color="#FF6B00" />
          <Text style={styles.actionLabel}>Déconnexion</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCircle} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="help-circle" size={24} color="#FF6B00" />
          <Text style={styles.actionLabel}>Aide</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  headerGradient: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#FFFFFF",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  profileSection: {
    marginTop: -30,
    marginBottom: 20,
    alignItems: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B00",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  uploadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F0F0",
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  roleChip: {
    marginTop: 4,
  },
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginLeft: 12,
  },
  infoList: {
    padding: 20,
  },
  infoRowList: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoValueList: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  editInput: {
    backgroundColor: "#FFFFFF",
    fontSize: 16,
  },
  actionsSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: "#212121",
    marginLeft: 16,
    fontWeight: "500",
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#757575",
    borderRadius: 12,
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#FF6B00",
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
  kycBadge: {
    padding: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  kycBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 8,
  },
})

export default ProfileScreen