import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { Picker } from "@react-native-picker/picker"
import { useVehicle } from "../../hooks/useVehicle"
import { VehicleType } from "../../types/models"
import { useTheme } from "../../contexts/ThemeContext"
import { useTranslation } from "react-i18next"

const AddVehicleScreen: React.FC = () => {
  const [formData, setFormData] = useState({
    type: VehicleType.MOTORCYCLE,
    licensePlate: "",
    brand: "",
    model: "",
    year: "",
    color: "",
    maxWeight: "",
    maxDistance: "",
    isElectric: false,
    customType: "",
  })
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const navigation = useNavigation()
  const { colors } = useTheme()
  const { createVehicle } = useVehicle()

  const handleSubmit = async () => {
    if (!formData.licensePlate.trim()) {
      Alert.alert("Erreur", "La plaque d'immatriculation est obligatoire")
      return
    }

    setLoading(true)
    try {
      await createVehicle({        vehicle_type: formData.type,
        license_plate: formData.licensePlate,brand: formData.brand || '',
        model: formData.model || '',
        year: formData.year ? parseInt(formData.year) : new Date().getFullYear(),
        color: formData.color || undefined,
        maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : undefined,
        maxDistance: formData.maxDistance ? parseFloat(formData.maxDistance) : undefined,
        isElectric: formData.isElectric,
        customType: formData.type === VehicleType.CUSTOM ? formData.customType : undefined,
      })

      Alert.alert("Succès", "Véhicule ajouté avec succès", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter le véhicule")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ajouter un véhicule</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations générales</Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Type de véhicule *</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={formData.type}
                onValueChange={(value) => updateFormData("type", value)}
                style={[styles.picker, { color: colors.text }]}
              >
                <Picker.Item label="Moto" value={VehicleType.MOTORCYCLE} />                <Picker.Item label="Voiture" value={VehicleType.PICKUP} />
                <Picker.Item label="Vélo" value={VehicleType.BICYCLE} />
                <Picker.Item label="Camion" value={VehicleType.VAN} />
                <Picker.Item label="Autre" value={VehicleType.CUSTOM} />
              </Picker>
            </View>
          </View>

          {formData.type === VehicleType.CUSTOM && (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Type personnalisé</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={formData.customType}
                onChangeText={(text) => updateFormData("customType", text)}
                placeholder="Ex: Scooter, Quad..."
                placeholderTextColor={colors.text + "60"}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Plaque d'immatriculation *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.licensePlate}
              onChangeText={(text) => updateFormData("licensePlate", text.toUpperCase())}
              placeholder="Ex: AA 123 BB"
              placeholderTextColor={colors.text + "60"}
              autoCapitalize="characters"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Marque</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.brand}
              onChangeText={(text) => updateFormData("brand", text)}
              placeholder="Ex: Honda, Toyota..."
              placeholderTextColor={colors.text + "60"}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Modèle</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={formData.model}
              onChangeText={(text) => updateFormData("model", text)}
              placeholder="Ex: CB 125, Corolla..."
              placeholderTextColor={colors.text + "60"}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Année</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={formData.year}
                onChangeText={(text) => updateFormData("year", text)}
                placeholder="2023"
                placeholderTextColor={colors.text + "60"}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Couleur</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={formData.color}
                onChangeText={(text) => updateFormData("color", text)}
                placeholder="Bleu"
                placeholderTextColor={colors.text + "60"}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Capacités</Text>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Poids max (kg)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={formData.maxWeight}
                onChangeText={(text) => updateFormData("maxWeight", text)}
                placeholder="50"
                placeholderTextColor={colors.text + "60"}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text }]}>Distance max (km)</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                value={formData.maxDistance}
                onChangeText={(text) => updateFormData("maxDistance", text)}
                placeholder="100"
                placeholderTextColor={colors.text + "60"}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <Text style={[styles.label, { color: colors.text }]}>Véhicule électrique</Text>
            <Switch
              value={formData.isElectric}
              onValueChange={(value) => updateFormData("isElectric", value)}
              trackColor={{ false: colors.border, true: colors.primary + "40" }}
              thumbColor={formData.isElectric ? colors.primary : "#f4f3f4"}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            loading && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? "Ajout en cours..." : "Ajouter le véhicule"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: "row",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default AddVehicleScreen
