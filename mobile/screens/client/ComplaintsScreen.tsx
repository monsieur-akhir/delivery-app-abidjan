
import React, { useState, useEffect } from 'react'
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { Text, TextInput, Button, Card, Chip, Surface, IconButton, FAB } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'

type ComplaintsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ComplaintsScreen'>
}

interface Complaint {
  id: number
  type: 'delivery' | 'payment' | 'courier' | 'technical' | 'other'
  subject: string
  description: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  delivery_id?: number
  response?: string
}

const ComplaintsScreen: React.FC<ComplaintsScreenProps> = ({ navigation }) => {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Form state
  const [type, setType] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [deliveryId, setDeliveryId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const complaintTypes = [
    { key: 'delivery', label: 'Problème de livraison', icon: 'truck' },
    { key: 'payment', label: 'Problème de paiement', icon: 'credit-card' },
    { key: 'courier', label: 'Problème avec coursier', icon: 'user' },
    { key: 'technical', label: 'Problème technique', icon: 'smartphone' },
    { key: 'other', label: 'Autre', icon: 'help-circle' },
  ]

  useEffect(() => {
    loadComplaints()
  }, [])

  const loadComplaints = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      setComplaints(data)
    } catch (error) {
      console.error('Error loading complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitComplaint = async () => {
    if (!type || !subject || !description) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/complaints/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          subject,
          description,
          delivery_id: deliveryId ? parseInt(deliveryId) : undefined
        })
      })

      if (response.ok) {
        Alert.alert('Succès', 'Votre plainte a été soumise avec succès')
        setShowForm(false)
        setType('')
        setSubject('')
        setDescription('')
        setDeliveryId('')
        loadComplaints()
      } else {
        throw new Error('Erreur lors de la soumission')
      }
    } catch (error) {
      console.error('Error submitting complaint:', error)
      Alert.alert('Erreur', 'Impossible de soumettre la plainte')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800'
      case 'in_progress': return '#2196f3'
      case 'resolved': return '#4caf50'
      case 'closed': return '#757575'
      default: return '#757575'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'in_progress': return 'En cours'
      case 'resolved': return 'Résolu'
      case 'closed': return 'Fermé'
      default: return 'Inconnu'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#4caf50'
      case 'medium': return '#ff9800'
      case 'high': return '#f44336'
      case 'urgent': return '#d32f2f'
      default: return '#757575'
    }
  }

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <IconButton icon="arrow-left" iconColor="#212121" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nouvelle plainte</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.formContainer}>
          <Surface style={styles.section}>
            <Text style={styles.sectionTitle}>Type de problème *</Text>
            <View style={styles.typeGrid}>
              {complaintTypes.map((complaintType) => (
                <TouchableOpacity
                  key={complaintType.key}
                  style={[
                    styles.typeCard,
                    type === complaintType.key && styles.selectedType
                  ]}
                  onPress={() => setType(complaintType.key)}
                >
                  <Feather 
                    name={complaintType.icon} 
                    size={24} 
                    color={type === complaintType.key ? '#FFFFFF' : '#FF6B00'} 
                  />
                  <Text style={[
                    styles.typeText,
                    type === complaintType.key && styles.selectedTypeText
                  ]}>
                    {complaintType.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>

          <Surface style={styles.section}>
            <Text style={styles.sectionTitle}>Détails</Text>
            
            {type === 'delivery' && (
              <TextInput
                label="Numéro de livraison (optionnel)"
                value={deliveryId}
                onChangeText={setDeliveryId}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            )}

            <TextInput
              label="Sujet *"
              value={subject}
              onChangeText={setSubject}
              mode="outlined"
              style={styles.input}
              placeholder="Résumé du problème"
            />

            <TextInput
              label="Description détaillée *"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={styles.input}
              placeholder="Décrivez votre problème en détail..."
            />
          </Surface>

          <Button
            mode="contained"
            onPress={submitComplaint}
            loading={submitting}
            disabled={submitting}
            style={styles.submitButton}
          >
            Soumettre la plainte
          </Button>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconButton icon="arrow-left" iconColor="#212121" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes plaintes</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {complaints.length > 0 ? (
          complaints.map((complaint) => (
            <Card key={complaint.id} style={styles.complaintCard}>
              <View style={styles.complaintHeader}>
                <View style={styles.complaintInfo}>
                  <Text style={styles.complaintSubject}>{complaint.subject}</Text>
                  <Text style={styles.complaintDate}>
                    {new Date(complaint.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <View style={styles.complaintBadges}>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(complaint.status) }]}
                    textStyle={styles.chipText}
                  >
                    {getStatusText(complaint.status)}
                  </Chip>
                </View>
              </View>
              
              <View style={styles.complaintContent}>
                <Text style={styles.complaintDescription} numberOfLines={3}>
                  {complaint.description}
                </Text>
                
                {complaint.response && (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseLabel}>Réponse :</Text>
                    <Text style={styles.responseText}>{complaint.response}</Text>
                  </View>
                )}
              </View>

              <View style={styles.complaintFooter}>
                <View style={styles.complaintType}>
                  <Feather 
                    name={complaintTypes.find(t => t.key === complaint.type)?.icon || 'help-circle'} 
                    size={16} 
                    color="#757575" 
                  />
                  <Text style={styles.typeLabel}>
                    {complaintTypes.find(t => t.key === complaint.type)?.label || 'Autre'}
                  </Text>
                </View>
                
                {complaint.delivery_id && (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DeliveryDetails', { 
                      deliveryId: complaint.delivery_id!.toString() 
                    })}
                  >
                    <Text style={styles.deliveryLink}>
                      Livraison #{complaint.delivery_id}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Feather name="message-circle" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>Aucune plainte</Text>
            <Text style={styles.emptySubtext}>
              Vous n'avez pas encore soumis de plainte
            </Text>
          </View>
        )}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        color="#FFFFFF"
        onPress={() => setShowForm(true)}
        label="Nouvelle plainte"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedType: {
    borderColor: '#FF6B00',
    backgroundColor: '#FF6B00',
  },
  typeText: {
    fontSize: 12,
    color: '#212121',
    textAlign: 'center',
    marginTop: 8,
  },
  selectedTypeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 32,
    backgroundColor: '#FF6B00',
  },
  complaintCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 8,
  },
  complaintInfo: {
    flex: 1,
  },
  complaintSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  complaintDate: {
    fontSize: 12,
    color: '#757575',
  },
  complaintBadges: {
    alignItems: 'flex-end',
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  complaintContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  complaintDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#212121',
  },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  complaintType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 4,
  },
  deliveryLink: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#FF6B00',
  },
})

export default ComplaintsScreen
