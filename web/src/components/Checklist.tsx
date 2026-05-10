import type { Location } from '../data/locations'

type Props = {
  locations: Location[]
  visited: Set<string>
  onToggle: (id: string) => void
}

const REGION_CLASS: Record<string, string> = {
  NE: 'northeast',
  SE: 'southeast',
  MW: 'midwest',
  SW: 'southwest',
  W: 'west',
  NW: 'west',
  INT: 'international',
  INTL: 'international',
}

function regionClass(region: string): string {
  return REGION_CLASS[region.toUpperCase()] ?? ''
}

export function Checklist({ locations, visited, onToggle }: Props) {
  return (
    <div className="checklist-view">
      {locations.length === 0 && <div className="empty">No matches</div>}
      {locations.map((l) => {
        const isVisited = visited.has(l.id)
        return (
          <div
            key={l.id}
            className={`location-item${isVisited ? ' visited' : ''}`}
            onClick={() => onToggle(l.id)}
          >
            <input
              type="checkbox"
              className="checkbox"
              checked={isVisited}
              onChange={() => onToggle(l.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Mark ${l.name} ${isVisited ? 'unvisited' : 'visited'}`}
            />
            <div className="location-info">
              <div className="location-name">{l.name}</div>
              <div className="location-address">
                {l.address}, {l.city}, {l.state} {l.zipcode}
              </div>
              <span className={`location-region ${regionClass(l.region)}`}>{l.region}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
