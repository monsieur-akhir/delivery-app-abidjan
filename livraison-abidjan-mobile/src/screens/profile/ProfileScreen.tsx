"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, Animated, Image } from "react-native"
import { Text, Card, Button, Avatar, TextInput, Divider, IconButton, ActivityIndicator, Surface, Chip } from "react-native-paper"
import { SafeAreaView } from "react-native-safe-area-context"
import { launchImageLibrary } from "../../utils/cameraPermissions"
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
import CustomLoaderModal from '../../components/CustomLoaderModal'
import { useUser } from '../../hooks/useUser'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import UserService from "../../services/UserService"
import colors from '../../styles/colors'
import { API_URL } from '../../config/environment'

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
  const { kycStatus, getKYCStatus, uploadKYCDocument } = useUser()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [editing, setEditing] = useState<boolean>(false)
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfileExtended>>({})
  const [saving, setSaving] = useState<boolean>(false)
  const [fadeAnim] = useState(new Animated.Value(0))
  const [kycDocuments, setKycDocuments] = useState<any[]>([])

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

  const loadKYCDocuments = async () => {
    try {
      const response = await UserService.getKYCDocuments();
      setKycDocuments(response)
      console.log('KYC DOCUMENTS récupérés:', response)
    } catch (error) {
      console.error('Erreur lors du chargement des documents KYC:', error)
    }
  }

  useEffect(() => {
    loadProfile()
    getKYCStatus()
    loadKYCDocuments()
  }, [loadProfile])

  useEffect(() => {
    if (kycStatus) {
      console.log('KYC STATUS récupéré:', kycStatus)
    }
  }, [kycStatus])

  useEffect(() => {
    if (kycStatus && kycStatus.status && kycStatus.status.status === 'verified') {
      loadProfile();
    }
  }, [kycStatus && kycStatus.status && kycStatus.status.status]);

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
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })
      if (result.canceled) return;
      const uri = result.assets && result.assets[0]?.uri;
      if (!uri) return;
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
          await loadProfile();
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
      console.error("Error picking image:", error)
      showErrorAlert(t("profile.error"), t("profile.errorPickingImage"))
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

  // Helper pour l'URL de la photo de profil
  const getProfilePictureUrl = (profile: any) => {
    if (!profile?.profile_picture) return require('../../assets/images/default-avatar.png');
    if (profile.profile_picture.startsWith('http')) return { uri: profile.profile_picture };
    // Utilise la base URL dynamique
    return { uri: `${API_URL.replace(/\/$/, '')}/${profile.profile_picture.replace(/^\//, '')}` };
  };

  // Helper pour le label du rôle
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'courier': return 'Coursier';
      case 'business': return 'Entreprise';
      case 'manager': return 'Gestionnaire';
      default: return 'Client';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomLoaderModal
          visible={loading}
          title="Chargement du profil..."
          message="Veuillez patienter"
          type="loading"
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F7FB' }}>
      <View style={{ flex: 1, marginTop: 8 }}>
        {/* Alerte profil incomplet */}
        {(!profile?.email || !profile?.commune || !profile?.profile_picture) && (
          <View style={{ backgroundColor: '#FFF8E1', padding: 16, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={20} color="#FF9800" style={{ marginRight: 8 }} />
            <Text style={{ color: '#795548', flex: 1 }}>
              Complétez votre profil pour une meilleure expérience.
            </Text>
          </View>
        )}

        <ScrollView>
          {/* Photo de profil */}
          <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                elevation: 3,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
              }}
            >
              <Image
                source={getProfilePictureUrl(profile)}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF9800', borderRadius: 15, padding: 8 }}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Badge Client */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#E8F5E9', 
              paddingHorizontal: 12, 
              paddingVertical: 6, 
              borderRadius: 16 
            }}>
              <Ionicons name="person" size={16} color="#4CAF50" style={{ marginRight: 6 }} />
              <Text style={{ color: '#4CAF50', fontWeight: '500' }}>{getRoleLabel(profile?.role)}</Text>
            </View>
          </View>

          {/* Infos personnelles */}
          <View style={{ 
            backgroundColor: '#fff', 
            marginHorizontal: 16,
            marginTop: 20,
            borderRadius: 12,
            padding: 20,
            elevation: 2
          }}>
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="person" size={20} color="#FF9800" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#212121' }}>{profile?.full_name || 'Client Test'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="call" size={20} color="#FF9800" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#212121' }}>{profile?.phone || '+22507071234567'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Ionicons name="mail" size={20} color="#FF9800" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#212121' }}>{profile?.email || 'client.test-delivery@yopmail.com'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location" size={20} color="#FF9800" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#212121' }}>{profile?.commune || 'Non renseignée'}</Text>
              </View>
            </View>
          </View>

          {/* Bouton Modifier */}
          <TouchableOpacity
            onPress={handleEdit}
            style={{
              backgroundColor: '#FF9800',
              marginHorizontal: 16,
              marginTop: 16,
              borderRadius: 8,
              padding: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Modifier</Text>
          </TouchableOpacity>

          {/* SECTION KYC */}
          <View style={{ margin: 20, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Mes documents KYC</Text>
            {kycDocuments && kycDocuments.length > 0 ? (
              kycDocuments.map((doc) => {
                const status = typeof doc.status === 'string' ? doc.status : doc.status.status;
                const isRejected = status === 'rejected';
                const isPending = status === 'pending';
                const isApproved = status === 'approved' || status === 'verified';
                const canReplace = kycStatus && kycStatus.status && kycStatus.status.status !== 'verified';

                return (
                  <View
                    key={doc.id}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isRejected ? '#F44336' : isApproved ? '#4CAF50' : '#FF9800',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      {/* Icône type */}
                      <Text style={{ fontWeight: 'bold', fontSize: 16, flex: 1 }}>
                        {doc.type.replace(/_/g, ' ').toUpperCase()}
                      </Text>
                      {/* Badge statut */}
                      <View
                        style={{
                          backgroundColor: isApproved
                            ? '#4CAF50'
                            : isRejected
                            ? '#F44336'
                            : '#FF9800',
                          borderRadius: 12,
                          paddingHorizontal: 10,
                          paddingVertical: 2,
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                          {status === 'pending'
                            ? 'En attente'
                            : status === 'approved' || status === 'verified'
                            ? 'Validé'
                            : status === 'rejected'
                            ? 'Refusé'
                            : status}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: '#666', marginBottom: 2 }}>
                      Date : {doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString() : '-'}
                    </Text>
                    {isRejected && doc.rejection_reason && (
                      <Text style={{ color: '#F44336', marginBottom: 2 }}>
                        Motif du refus : {doc.rejection_reason}
                      </Text>
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                      <TouchableOpacity
                        onPress={() => {
                          // TODO: Vérifier que 'DocumentViewer' existe dans RootStackParamList
                          navigation.navigate('DocumentViewer' as any, { url: doc.url });
                        }}
                        style={{
                          backgroundColor: '#1976D2',
                          borderRadius: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          marginRight: 10,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 4 }}>Voir</Text>
                        <Ionicons name="eye" size={16} color="#fff" />
                      </TouchableOpacity>
                      {canReplace && (
                        <Button
                          mode="outlined"
                          style={{ borderColor: colors.orange }}
                          textColor={colors.orange}
                          onPress={async () => {
                            try {
                              Alert.alert(
                                'Remplacement',
                                'Voulez-vous remplacer ce document ?',
                                [
                                  { text: 'Annuler', style: 'cancel' },
                                  {
                                    text: 'Remplacer',
                                    style: 'default',
                                    onPress: async () => {
                                      try {
                                        const result = await DocumentPicker.getDocumentAsync({
                                          type: ['image/png', 'image/jpeg', 'application/pdf'],
                                          copyToCacheDirectory: true,
                                        });
                                        if ('canceled' in result && result.canceled) return;
                                        let fileUri = '';
                                        if ('assets' in result && result.assets && result.assets[0]) {
                                          fileUri = result.assets[0].uri;
                                        } else if ('uri' in result && result.uri) {
                                          fileUri = result.uri;
                                        }
                                        if (!fileUri) return;
                                        await uploadKYCDocument(doc.type, fileUri);
                                        await loadKYCDocuments();
                                        Alert.alert('Succès', 'Document remplacé avec succès.');
                                      } catch (error) {
                                        Alert.alert('Erreur', (error as any)?.message || "Erreur lors du remplacement du document.");
                                      }
                                    },
                                  },
                                ]
                              );
                            } catch (error) {
                              Alert.alert('Erreur', (error as any)?.message || "Erreur lors du remplacement du document.");
                            }
                          }}
                        >
                          Remplacer
                        </Button>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text>Aucun document KYC trouvé.</Text>
            )}
            {kycStatus && kycStatus.status && kycStatus.status.status === 'verified' && (
              <Text style={{ color: 'green', marginTop: 8 }}>
                Votre KYC est vérifié. Vous ne pouvez plus modifier vos documents.
              </Text>
            )}
          </View>

          {/* Actions en bas */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            marginTop: 40,
            marginHorizontal: 20,
            marginBottom: 20 
          }}>
            <TouchableOpacity 
              style={{ alignItems: 'center' }} 
              onPress={() => navigation.navigate('Settings')}
            >
              <View style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 28,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
                marginBottom: 8
              }}>
                <Ionicons name="settings" size={24} color="#FF9800" />
                </View>
              <Text style={{ color: '#757575', fontSize: 12 }}>Paramètres</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ alignItems: 'center' }} 
              onPress={() => signOut()}
            >
              <View style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 28,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
                marginBottom: 8
              }}>
                <Ionicons name="log-out" size={24} color="#FF9800" />
                </View>
              <Text style={{ color: '#757575', fontSize: 12 }}>Déconnexion</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ alignItems: 'center' }} 
              onPress={() => navigation.navigate('Support')}
            >
              <View style={{ 
                width: 56, 
                height: 56, 
                borderRadius: 28,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                elevation: 2,
                marginBottom: 8
              }}>
                <Ionicons name="help-circle" size={24} color="#FF9800" />
                </View>
              <Text style={{ color: '#757575', fontSize: 12 }}>Aide</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000'
  },
  scrollView: {
    flex: 1,
    padding: 16
  },
  statusCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  addressCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  priceCard: {
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  statusInfo: {
    flex: 1
  },
  deliveryId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 0
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: '#EF5350'
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  deliveryDate: {
    fontSize: 14,
    color: '#757575'
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F7FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
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