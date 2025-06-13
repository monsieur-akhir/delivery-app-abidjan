
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import VoiceAssistant from '../../components/VoiceAssistant'
import { useAuth } from '../../contexts/AuthContext'
import { useNetwork } from '../../contexts/NetworkContext'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../../types/navigation'

// Mock jest functions
const mockJest = {
  mock: jest.mock,
  fn: jest.fn,
  clearAllMocks: jest.clearAllMocks,
  requireMock: jest.requireMock
}

mockJest.mock("../../services/api", () => ({
  processVoiceCommand: mockJest.fn(() =>
    Promise.resolve({
      action: "navigate",
      destination: "CreateDelivery",
      params: {},
    })
  ),
}))

mockJest.mock("../../contexts/AuthContext")
mockJest.mock("../../contexts/NetworkContext")

const mockNavigation: Partial<NativeStackNavigationProp<RootStackParamList>> = {
  navigate: mockJest.fn(),
  dispatch: mockJest.fn(),
  reset: mockJest.fn(),
  goBack: mockJest.fn(),
  isFocused: mockJest.fn(() => true),
  canGoBack: mockJest.fn(() => true),
  getId: mockJest.fn(() => 'test-id'),
  getState: mockJest.fn(() => ({ routes: [], index: 0 })),
  setParams: mockJest.fn(),
  setOptions: mockJest.fn(),
  addListener: mockJest.fn(),
  removeListener: mockJest.fn(),
  getParent: mockJest.fn()
}

describe("VoiceAssistant", () => {
  beforeEach(() => {
    mockJest.clearAllMocks()
  })

  it("renders correctly", () => {
    const { getByRole } = render(<VoiceAssistant navigation={mockNavigation as NativeStackNavigationProp<RootStackParamList>} />)
    expect(getByRole("button")).toBeTruthy()
  })

  it("shows recording state when pressed", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: 1 } })
    ;(useNetwork as jest.Mock).mockReturnValue({ isConnected: true })

    const { getByRole, getByText } = render(<VoiceAssistant navigation={mockNavigation as NativeStackNavigationProp<RootStackParamList>} />)

    const button = getByRole("button")
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText("En cours d'écoute...")).toBeTruthy()
    })
  })

  it("handles voice command processing", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: 1 } })
    ;(useNetwork as jest.Mock).mockReturnValue({ isConnected: true })

    const { getByRole, getByText, queryByText } = render(<VoiceAssistant navigation={mockNavigation as NativeStackNavigationProp<RootStackParamList>} />)

    const button = getByRole("button")
    fireEvent.press(button)

    await waitFor(() => {
      expect(queryByText("En cours d'écoute...")).toBeTruthy()
    })

    // Simulate end of recording
    fireEvent.press(button)

    await waitFor(() => {
      expect(queryByText("Traitement en cours...")).toBeTruthy()
    })
  })

  it("handles navigation after voice command", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: 1 } })
    ;(useNetwork as jest.Mock).mockReturnValue({ isConnected: true })

    const { getByRole, getByText, findByText } = render(<VoiceAssistant navigation={mockNavigation as NativeStackNavigationProp<RootStackParamList>} />)

    const button = getByRole("button")
    fireEvent.press(button)

    await waitFor(() => {
      expect(getByText("En cours d'écoute...")).toBeTruthy()
    })

    fireEvent.press(button)

    await findByText("Traitement en cours...")

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith("CreateDelivery", {})
    }, { timeout: 5000 })
  })

  it("shows offline message when network is not available", async () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: { id: 1 } })
    
    const useNetworkMock = jest.requireMock("../../contexts/NetworkContext").useNetwork as jest.Mock
    useNetworkMock.mockReturnValue({ isConnected: false })

    ;(useNetwork as jest.Mock).mockReturnValue({ isConnected: false })

    const { getByRole, getByText, findByText } = render(<VoiceAssistant navigation={mockNavigation as NativeStackNavigationProp<RootStackParamList>} />)

    const button = getByRole("button")
    fireEvent.press(button)

    await findByText("Connexion requise pour utiliser l'assistant vocal")
  })

  it("requires authentication", () => {
    ;(useAuth as jest.Mock).mockReturnValue({ user: null })
    ;(useNetwork as jest.Mock).mockReturnValue({ isConnected: true })

    const { getByRole, getByText, queryByText } = render(<VoiceAssistant navigation={mockNavigation as NativeStackNavigationProp<RootStackParamList>} />)

    const button = getByRole("button")
    fireEvent.press(button)

    expect(queryByText("Authentification requise")).toBeTruthy()
  })
})
