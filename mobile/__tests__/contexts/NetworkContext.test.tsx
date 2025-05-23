import { renderHook, act } from "@testing-library/react-hooks"
import { NetworkProvider, useNetwork } from "../../contexts/NetworkContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import jest from "jest" // Import jest to declare the variable

// Mock pour NetInfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}))

// Wrapper pour le hook
const wrapper = ({ children }) => <NetworkProvider>{children}</NetworkProvider>

describe("NetworkContext", () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks()
    AsyncStorage.clear()
  })

  it("provides the network context with default values", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetwork(), { wrapper })

    // Attendre que les effets asynchrones se terminent
    await waitForNextUpdate()

    // Vérifier les valeurs par défaut
    expect(result.current.isConnected).toBe(true)
    expect(result.current.isOfflineMode).toBe(false)
    expect(result.current.pendingUploads).toEqual([])
    expect(result.current.pendingDownloads).toEqual([])
    expect(result.current.syncInProgress).toBe(false)
    expect(result.current.lastSyncTime).toBeNull()
  })

  it("toggles offline mode", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetwork(), { wrapper })

    // Attendre que les effets asynchrones se terminent
    await waitForNextUpdate()

    // Activer le mode hors ligne
    await act(async () => {
      const success = await result.current.toggleOfflineMode(true)
      expect(success).toBe(true)
    })

    // Vérifier que le mode hors ligne est activé
    expect(result.current.isOfflineMode).toBe(true)

    // Vérifier que la valeur a été sauvegardée dans AsyncStorage
    expect(AsyncStorage.setItem).toHaveBeenCalledWith("offlineMode", "true")

    // Désactiver le mode hors ligne
    await act(async () => {
      const success = await result.current.toggleOfflineMode(false)
      expect(success).toBe(false)
    })

    // Vérifier que le mode hors ligne est désactivé
    expect(result.current.isOfflineMode).toBe(false)
  })

  it("adds pending upload", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetwork(), { wrapper })

    // Attendre que les effets asynchrones se terminent
    await waitForNextUpdate()

    // Ajouter un téléversement en attente
    await act(async () => {
      const success = result.current.addPendingUpload({
        type: "delivery",
        data: { id: 1, status: "pending" },
        timestamp: new Date().toISOString(),
      })
      expect(success).toBe(true)
    })

    // Vérifier que le téléversement a été ajouté
    expect(result.current.pendingUploads.length).toBe(1)
    expect(result.current.pendingUploads[0].type).toBe("delivery")

    // Vérifier que la liste a été sauvegardée dans AsyncStorage
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it("removes pending upload", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetwork(), { wrapper })

    // Attendre que les effets asynchrones se terminent
    await waitForNextUpdate()

    // Ajouter un téléversement en attente
    await act(async () => {
      result.current.addPendingUpload({
        type: "delivery",
        data: { id: 1, status: "pending" },
        timestamp: new Date().toISOString(),
      })
    })

    // Récupérer l'ID du téléversement
    const uploadId = result.current.pendingUploads[0].id

    // Supprimer le téléversement
    await act(async () => {
      const success = result.current.removePendingUpload(uploadId)
      expect(success).toBe(true)
    })

    // Vérifier que le téléversement a été supprimé
    expect(result.current.pendingUploads.length).toBe(0)

    // Vérifier que la liste a été sauvegardée dans AsyncStorage
    expect(AsyncStorage.setItem).toHaveBeenCalled()
  })

  it("clears all pending data", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetwork(), { wrapper })

    // Attendre que les effets asynchrones se terminent
    await waitForNextUpdate()

    // Ajouter des données en attente
    await act(async () => {
      result.current.addPendingUpload({
        type: "delivery",
        data: { id: 1, status: "pending" },
        timestamp: new Date().toISOString(),
      })

      result.current.addPendingDownload({
        type: "delivery_details",
        data: { id: 1 },
        timestamp: new Date().toISOString(),
      })
    })

    // Vérifier que les données ont été ajoutées
    expect(result.current.pendingUploads.length).toBe(1)
    expect(result.current.pendingDownloads.length).toBe(1)

    // Effacer toutes les données
    await act(async () => {
      const success = await result.current.clearPendingData()
      expect(success).toBe(true)
    })

    // Vérifier que les données ont été effacées
    expect(result.current.pendingUploads.length).toBe(0)
    expect(result.current.pendingDownloads.length).toBe(0)

    // Vérifier que les données ont été supprimées d'AsyncStorage
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("pendingUploads")
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("pendingDownloads")
  })

  it("handles connectivity changes", async () => {
    const { result, waitForNextUpdate } = renderHook(() => useNetwork(), { wrapper })

    // Attendre que les effets asynchrones se terminent
    await waitForNextUpdate()

    // Simuler une perte de connexion
    const mockListener = NetInfo.addEventListener.mock.calls[0][0]

    await act(async () => {
      mockListener({ isConnected: false, isInternetReachable: false })
    })

    // Vérifier que l'état de connexion a été mis à jour
    expect(result.current.isConnected).toBe(false)

    // Simuler un rétablissement de la connexion
    await act(async () => {
      mockListener({ isConnected: true, isInternetReachable: true })
    })

    // Vérifier que l'état de connexion a été mis à jour
    expect(result.current.isConnected).toBe(true)
  })
})
