import { describe, it, expect } from 'vitest'
import { generateShareFormats } from './formats'
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

const FIXED_DATE = new Date('2026-05-09T12:00:00Z')

describe('generateShareFormats', () => {
  it('handles zero progress', () => {
    const f = generateShareFormats([loc('a', 'CA', 'W')], new Set(), FIXED_DATE)
    expect(f.basic).toMatch(/0\/1/)
    expect(f.basic).toMatch(/\(0%\)/)
    expect(f.detailed).toMatch(/None yet/)
    expect(f.minimal).toMatch(/0\/1 Costcos/)
  })

  it('counts visited / states / regions correctly', () => {
    const locs = [
      loc('a', 'CA', 'BA'),
      loc('b', 'CA', 'LA'),
      loc('c', 'NY', 'NE'),
      loc('d', 'TX', 'TE'),
    ]
    const visited = new Set(['a', 'c']) // CA + NY visited; BA + NE regions
    const f = generateShareFormats(locs, visited, FIXED_DATE)
    expect(f.basic).toMatch(/2\/4 locations \(50%\)/)
    expect(f.basic).toMatch(/2\/3 states\/provinces · 2\/4 regions/)
    expect(f.minimal).toMatch(/2\/4 Costcos \(50%\)/)
  })

  it('renders region emojis in detailed format', () => {
    const locs = [loc('a', 'NY', 'NE'), loc('b', 'CA', 'BA')]
    const f = generateShareFormats(locs, new Set(['a', 'b']), FIXED_DATE)
    expect(f.detailed).toMatch(/🗽 Northeast/)
    expect(f.detailed).toMatch(/🌉 Bay Area/)
  })

  it('truncates long state lists', () => {
    const states = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA']
    const locs = states.map((s, i) => loc(`l${i}`, s, 'X'))
    const visited = new Set(locs.map((l) => l.id))
    const f = generateShareFormats(locs, visited, FIXED_DATE)
    expect(f.detailed).toMatch(/\+2 more/)
    expect(f.redditDetailed).toMatch(/\.\.\./)
  })

  it('progress bar shows correct fill ratio', () => {
    const locs = Array.from({ length: 10 }, (_, i) => loc(`l${i}`, 'CA', 'BA'))
    const visited = new Set(['l0', 'l1', 'l2', 'l3', 'l4']) // 50%
    const f = generateShareFormats(locs, visited, FIXED_DATE)
    expect(f.detailed).toContain('█'.repeat(10) + '░'.repeat(10))
    expect(f.reddit).toContain('█'.repeat(5) + '░'.repeat(5))
  })

  it('handles empty location list without crashing', () => {
    const f = generateShareFormats([], new Set(), FIXED_DATE)
    expect(f.basic).toMatch(/0\/0/)
    expect(f.detailed).toMatch(/0%/)
  })
})
