import type { Location } from '../data/locations'

type Props = {
  locations: Location[]
  visited: Set<string>
}

export function computeStats(locations: Location[], visited: Set<string>) {
  const total = locations.length
  const visitedCount = locations.filter((l) => visited.has(l.id)).length
  const states = new Set<string>()
  const visitedStates = new Set<string>()
  const visitedRegions = new Set<string>()
  for (const l of locations) {
    states.add(l.state)
    if (visited.has(l.id)) {
      visitedStates.add(l.state)
      visitedRegions.add(l.region)
    }
  }
  return {
    total,
    visitedCount,
    pct: total === 0 ? 0 : Math.round((visitedCount / total) * 100),
    states: states.size,
    visitedStates: visitedStates.size,
    visitedRegions: visitedRegions.size,
  }
}

export function Stats({ locations, visited }: Props) {
  const s = computeStats(locations, visited)
  return (
    <div className="stats">
      <div className="stat-item">
        <div className="stat-number">{s.visitedCount}</div>
        <div className="stat-label">Visited</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">{s.total}</div>
        <div className="stat-label">Total Locations</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">{s.pct}%</div>
        <div className="stat-label">Completion</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">{s.visitedStates}</div>
        <div className="stat-label">States</div>
      </div>
      <div className="stat-item">
        <div className="stat-number">{s.visitedRegions}</div>
        <div className="stat-label">Regions</div>
      </div>
    </div>
  )
}
