import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { mergeVisits, useVisits } from './useVisits'

vi.mock('../api/client', () => ({
  fetchVisits: vi.fn(),
  putVisits: vi.fn(),
}))

import { fetchVisits, putVisits } from '../api/client'

beforeEach(() => {
  localStorage.clear()
  vi.mocked(fetchVisits).mockReset()
  vi.mocked(putVisits).mockReset()
})

describe('mergeVisits', () => {
  it('returns the union, dedup', () => {
    const merged = mergeVisits(['a', 'b'], ['b', 'c'])
    expect([...merged].sort()).toEqual(['a', 'b', 'c'])
  })

  it('handles empty inputs', () => {
    expect([...mergeVisits([], [])]).toEqual([])
    expect([...mergeVisits(['a'], [])]).toEqual(['a'])
    expect([...mergeVisits([], ['b'])]).toEqual(['b'])
  })
})

describe('useVisits', () => {
  it('hydrates from localStorage when unauthed and never calls the API', () => {
    localStorage.setItem('costco-roadtrip:visited', JSON.stringify(['x', 'y']))
    const { result } = renderHook(() => useVisits(false))
    expect([...result.current.visited].sort()).toEqual(['x', 'y'])
    expect(fetchVisits).not.toHaveBeenCalled()
  })

  it('toggle adds and removes ids and persists to localStorage', () => {
    const { result } = renderHook(() => useVisits(false))
    act(() => result.current.toggle('a'))
    expect(result.current.visited.has('a')).toBe(true)
    expect(JSON.parse(localStorage.getItem('costco-roadtrip:visited')!)).toEqual(['a'])

    act(() => result.current.toggle('a'))
    expect(result.current.visited.has('a')).toBe(false)
    expect(JSON.parse(localStorage.getItem('costco-roadtrip:visited')!)).toEqual([])
  })

  it('on auth, hydrates from API and merges with local', async () => {
    localStorage.setItem('costco-roadtrip:visited', JSON.stringify(['local-only']))
    vi.mocked(fetchVisits).mockResolvedValue(['remote-only'])
    vi.mocked(putVisits).mockResolvedValue(['local-only', 'remote-only'])

    const { result } = renderHook(() => useVisits(true))
    await waitFor(() => {
      expect([...result.current.visited].sort()).toEqual(['local-only', 'remote-only'])
    })

    // Local had an entry remote didn't, so the merge gets pushed up.
    await waitFor(() => expect(putVisits).toHaveBeenCalled())
  })

  it('debounces writes when authed', async () => {
    vi.mocked(fetchVisits).mockResolvedValue([])
    vi.mocked(putVisits).mockResolvedValue([])

    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      const { result } = renderHook(() => useVisits(true))
      await vi.waitFor(() => expect(fetchVisits).toHaveBeenCalled())
      vi.mocked(putVisits).mockClear()

      act(() => result.current.toggle('a'))
      act(() => result.current.toggle('b'))
      act(() => result.current.toggle('c'))
      expect(putVisits).not.toHaveBeenCalled()

      await act(async () => {
        await vi.advanceTimersByTimeAsync(900)
      })

      await vi.waitFor(() => expect(putVisits).toHaveBeenCalledTimes(1))
      expect(vi.mocked(putVisits).mock.calls[0]?.[0]).toEqual(
        expect.arrayContaining(['a', 'b', 'c']),
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('surfaces errors from the API as state', async () => {
    vi.mocked(fetchVisits).mockRejectedValue(new Error('boom'))
    const { result } = renderHook(() => useVisits(true))
    await waitFor(() => expect(result.current.error).toMatch(/boom/))
  })
})
