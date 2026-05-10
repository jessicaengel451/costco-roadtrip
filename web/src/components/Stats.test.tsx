import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { computeStats, Stats } from './Stats'
import type { Location } from '../data/locations'

const loc = (id: string, state: string, region: string): Location => ({
  id,
  name: `Loc ${id}`,
  address: '1 Test St',
  city: 'Town',
  state,
  zipcode: '00000',
  phone: '',
  url: '',
  country: 'US',
  region,
  lat: 0,
  lng: 0,
})

describe('computeStats', () => {
  it('returns zeros when nothing is visited', () => {
    const locs = [loc('a', 'CA', 'W'), loc('b', 'NY', 'NE')]
    const s = computeStats(locs, new Set())
    expect(s).toMatchObject({
      total: 2,
      visitedCount: 0,
      pct: 0,
      states: 2,
      visitedStates: 0,
      visitedRegions: 0,
    })
  })

  it('counts visited stores, states, regions', () => {
    const locs = [
      loc('a', 'CA', 'W'),
      loc('b', 'CA', 'W'),
      loc('c', 'NY', 'NE'),
      loc('d', 'TX', 'SW'),
    ]
    const s = computeStats(locs, new Set(['a', 'c']))
    expect(s.total).toBe(4)
    expect(s.visitedCount).toBe(2)
    expect(s.pct).toBe(50)
    expect(s.states).toBe(3) // total distinct states
    expect(s.visitedStates).toBe(2) // CA, NY
    expect(s.visitedRegions).toBe(2) // W, NE
  })

  it('handles an empty location list', () => {
    const s = computeStats([], new Set())
    expect(s).toEqual({
      total: 0,
      visitedCount: 0,
      pct: 0,
      states: 0,
      visitedStates: 0,
      visitedRegions: 0,
    })
  })

  it('ignores visited ids that are not in the location list', () => {
    const locs = [loc('a', 'CA', 'W')]
    const s = computeStats(locs, new Set(['a', 'ghost']))
    expect(s.visitedCount).toBe(1)
  })
})

describe('<Stats />', () => {
  it('renders the five tiles', () => {
    const locs = [loc('a', 'CA', 'W'), loc('b', 'NY', 'NE')]
    render(<Stats locations={locs} visited={new Set(['a'])} />)
    expect(screen.getByText('Visited')).toBeInTheDocument()
    expect(screen.getByText('Total Locations')).toBeInTheDocument()
    expect(screen.getByText('Completion')).toBeInTheDocument()
    expect(screen.getByText('States')).toBeInTheDocument()
    expect(screen.getByText('Regions')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
