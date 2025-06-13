import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import NetInfo from '@react-native-community/netinfo'
import { NetworkProvider, useNetwork } from '../../contexts/NetworkContext'
import type { ReactNode } from 'react'

// Mock jest functions
const mockJest = {
  mock: jest.mock,
  fn: jest.fn,
  clearAllMocks: jest.clearAllMocks
}

mockJest.mock("@react-native-community/netinfo", () => ({
  addEventListener: mockJest.fn(() => mockJest.fn()),
  fetch: mockJest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}))

mockJest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: mockJest.fn(() => Promise.resolve(null)),
  setItem: mockJest.fn(() => Promise.resolve()),
}))

const wrapper = ({ children }: { children: ReactNode }) => <NetworkProvider>{children}</NetworkProvider>

describe("NetworkContext", () => {
  beforeEach(() => {
    mockJest.clearAllMocks()
  })

  it("provides network context", () => {
    const { result } = renderHook(() => useNetwork(), { wrapper })

    expect(result.current.isConnected).toBeDefined()
    expect(result.current.isOnline).toBeDefined()
    expect(result.current.pendingUploads).toEqual([])
    expect(result.current.pendingDownloads).toEqual([])
    expect(result.current.addPendingUpload).toBeDefined()
    expect(result.current.syncPendingOperations).toBeDefined()
  })

  it("can add pending upload", () => {
    const { result } = renderHook(() => useNetwork(), { wrapper })

    act(() => {
      result.current.addPendingUpload('delivery', {
        pickup_address: 'Test address',
        delivery_address: 'Test delivery',
        package_type: 'small',
      })
    })

    expect(result.current.pendingUploads).toHaveLength(1)
    expect(result.current.pendingUploads[0].type).toBe('delivery')
  })

  it("can sync pending operations", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper })

    act(() => {
      result.current.addPendingUpload('delivery', {
        pickup_address: 'Test address',
        delivery_address: 'Test delivery',
        package_type: 'small',
      })
    })

    await act(async () => {
      await result.current.syncPendingOperations()
    })

    expect(result.current.pendingUploads).toHaveLength(0)
  })

  it("handles network state changes", async () => {
    const { result } = renderHook(() => useNetwork(), { wrapper })

    // Simulate network change
    const mockListener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0]
    act(() => {
      mockListener({ isConnected: false, isInternetReachable: false })
    })

    expect(result.current.isConnected).toBe(false)
  })
})