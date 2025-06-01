import React from 'react'
import { render, act, waitFor } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import * as api from '../../services/api'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

// Mock API calls
jest.mock('../../services/api', () => ({
  login: jest.fn(),
  register: jest.fn(),
  verifyOTP: jest.fn(),
  loginWithOTP: jest.fn(),
}))

// Test component to access context
const TestComponent = ({ onAuthState }: { onAuthState: (state: any) => void }) => {
  const authState = useAuth()
  
  React.useEffect(() => {
    onAuthState(authState)
  }, [authState, onAuthState])
  
  return null
}

describe('AuthContext', () => {
  const mockUser = {
    id: '1',
    phone: '+22507123456',
    full_name: 'Test User',
    role: 'client',
    status: 'active',
  }
  
  const mockToken = 'mock-jwt-token'

  beforeEach(() => {
    jest.clearAllMocks()
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null)
  })

  it('should initialize with null user and token', async () => {
    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authState).toBeDefined()
      expect(authState.user).toBeNull()
      expect(authState.token).toBeNull()
      expect(authState.loading).toBe(false)
    })
  })

  it('should load user data from AsyncStorage on initialization', async () => {
    ;(AsyncStorage.getItem as jest.Mock)
      .mockImplementation((key: string) => {
        if (key === 'user') return Promise.resolve(JSON.stringify(mockUser))
        if (key === 'token') return Promise.resolve(mockToken)
        return Promise.resolve(null)
      })

    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authState.user).toEqual(mockUser)
      expect(authState.token).toBe(mockToken)
      expect(authState.loading).toBe(false)
    })
  })

  it('should handle signIn successfully', async () => {
    ;(api.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    })

    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authState).toBeDefined()
    })

    await act(async () => {
      await authState.signIn('+22507123456', 'password123')
    })

    expect(api.login).toHaveBeenCalledWith('+22507123456', 'password123')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser))
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', mockToken)
    expect(authState.user).toEqual(mockUser)
    expect(authState.token).toBe(mockToken)
  })

  it('should handle setAuthData correctly', async () => {
    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authState).toBeDefined()
    })

    act(() => {
      authState.setAuthData(mockUser, mockToken)
    })

    expect(authState.user).toEqual(mockUser)
    expect(authState.token).toBe(mockToken)
  })

  it('should handle signOut correctly', async () => {
    // Setup initial authenticated state
    ;(AsyncStorage.getItem as jest.Mock)
      .mockImplementation((key: string) => {
        if (key === 'user') return Promise.resolve(JSON.stringify(mockUser))
        if (key === 'token') return Promise.resolve(mockToken)
        return Promise.resolve(null)
      })

    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authState.user).toEqual(mockUser)
      expect(authState.token).toBe(mockToken)
    })

    await act(async () => {
      await authState.signOut()
    })

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user')
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token')
    expect(authState.user).toBeNull()
    expect(authState.token).toBeNull()
  })

  it('should handle updateUserData correctly', async () => {
    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    // First set initial user data
    act(() => {
      authState.setAuthData(mockUser, mockToken)
    })

    const updatedData = { full_name: 'Updated User Name' }

    act(() => {
      authState.updateUserData(updatedData)
    })

    expect(authState.user.full_name).toBe('Updated User Name')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'user',
      JSON.stringify({ ...mockUser, ...updatedData })
    )
  })

  it('should handle signIn errors correctly', async () => {
    const errorMessage = 'Invalid credentials'
    ;(api.login as jest.Mock).mockRejectedValue(new Error(errorMessage))

    let authState: any

    render(
      <AuthProvider>
        <TestComponent onAuthState={(state) => { authState = state }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authState).toBeDefined()
    })

    await expect(
      act(async () => {
        await authState.signIn('+22507123456', 'wrong-password')
      })
    ).rejects.toThrow(errorMessage)

    expect(authState.error).toBe(errorMessage)
    expect(authState.user).toBeNull()
    expect(authState.token).toBeNull()
  })
})
