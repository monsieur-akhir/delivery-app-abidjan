import { render, fireEvent, waitFor } from "@testing-library/react-native"
import VoiceAssistant from "../../components/VoiceAssistant"
import { Audio } from "expo-av"
import * as Speech from "expo-speech"
import { processVoiceCommand } from "../../services/api"
import jest from "jest" // Import jest to declare the variable

// Mock pour processVoiceCommand
jest.mock("../../services/api", () => ({
  processVoiceCommand: jest.fn(() =>
    Promise.resolve({
      transcript: "Créer une livraison",
      response: "Je vais créer une livraison pour vous",
      action: {
        type: "create_delivery",
        params: {},
      },
    }),
  ),
}))

// Mock pour la navigation
const mockNavigation = {
  navigate: jest.fn(),
}

describe("VoiceAssistant Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders correctly", () => {
    const { getByRole } = render(<VoiceAssistant navigation={mockNavigation} />)

    // Vérifier que le bouton flottant est rendu
    const button = getByRole("button")
    expect(button).toBeTruthy()
  })

  it("opens the modal when the button is pressed", () => {
    const { getByRole, getByText } = render(<VoiceAssistant navigation={mockNavigation} />)

    // Cliquer sur le bouton flottant
    const button = getByRole("button")
    fireEvent.press(button)

    // Vérifier que le modal est ouvert
    expect(getByText("voiceAssistant.title")).toBeTruthy()
    expect(getByText("voiceAssistant.tapToSpeak")).toBeTruthy()
  })

  it("starts recording when the microphone button is pressed", async () => {
    const { getByRole, getByText, queryByText } = render(<VoiceAssistant navigation={mockNavigation} />)

    // Ouvrir le modal
    const button = getByRole("button")
    fireEvent.press(button)

    // Cliquer sur le bouton du microphone
    const micButton = getByText("voiceAssistant.tapToSpeak").parent
    fireEvent.press(micButton)

    // Vérifier que l'enregistrement a commencé
    await waitFor(() => {
      expect(Audio.Recording.prototype.prepareToRecordAsync).toHaveBeenCalled()
      expect(Audio.Recording.prototype.startAsync).toHaveBeenCalled()
      expect(queryByText("voiceAssistant.listening")).toBeTruthy()
    })
  })

  it("processes the recording when stopped", async () => {
    const { getByRole, getByText, findByText } = render(<VoiceAssistant navigation={mockNavigation} />)

    // Ouvrir le modal
    const button = getByRole("button")
    fireEvent.press(button)

    // Cliquer sur le bouton du microphone pour commencer l'enregistrement
    const micButton = getByText("voiceAssistant.tapToSpeak").parent
    fireEvent.press(micButton)

    // Attendre que l'enregistrement commence
    await findByText("voiceAssistant.listening")

    // Simuler l'arrêt de l'enregistrement
    const stopButton = await findByText("voiceAssistant.listening")
    fireEvent.press(stopButton)

    // Vérifier que l'enregistrement a été arrêté et traité
    await waitFor(() => {
      expect(Audio.Recording.prototype.stopAndUnloadAsync).toHaveBeenCalled()
      expect(processVoiceCommand).toHaveBeenCalled()
      expect(Speech.speak).toHaveBeenCalled()
    })

    // Vérifier que la transcription et la réponse sont affichées
    await findByText("voiceAssistant.youSaid")
    await findByText("Créer une livraison")
    await findByText("voiceAssistant.response")
    await findByText("Je vais créer une livraison pour vous")

    // Vérifier que la navigation est appelée après un délai
    await waitFor(
      () => {
        expect(mockNavigation.navigate).toHaveBeenCalledWith("CreateDelivery", {})
      },
      { timeout: 3000 },
    )
  })

  it("shows an error message when offline", async () => {
    // Modifier le mock pour simuler un état hors ligne
    const useNetworkMock = jest.requireMock("../../contexts/NetworkContext").useNetwork
    useNetworkMock.mockReturnValueOnce({
      isConnected: false,
      isOfflineMode: false,
    })

    const { getByRole, getByText, findByText } = render(<VoiceAssistant navigation={mockNavigation} />)

    // Ouvrir le modal
    const button = getByRole("button")
    fireEvent.press(button)

    // Cliquer sur le bouton du microphone
    const micButton = getByText("voiceAssistant.tapToSpeak").parent
    fireEvent.press(micButton)

    // Vérifier que le message d'erreur est affiché
    await findByText("voiceAssistant.offlineError")
  })

  it("closes the modal when the close button is pressed", () => {
    const { getByRole, getByText, queryByText } = render(<VoiceAssistant navigation={mockNavigation} />)

    // Ouvrir le modal
    const button = getByRole("button")
    fireEvent.press(button)

    // Vérifier que le modal est ouvert
    expect(getByText("voiceAssistant.title")).toBeTruthy()

    // Cliquer sur le bouton de fermeture
    const closeButton = getByText("voiceAssistant.title").parent.children[1]
    fireEvent.press(closeButton)

    // Vérifier que le modal est fermé
    expect(queryByText("voiceAssistant.title")).toBeNull()
  })
})
