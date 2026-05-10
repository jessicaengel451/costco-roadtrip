import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Location } from '../data/locations'

type Props = {
  locations: Location[]
  visited: Set<string>
  onToggle: (id: string) => void
}

export function CostcoMap({ locations, visited, onToggle }: Props) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height: '600px', width: '100%' }}
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => {
        const isVisited = visited.has(loc.id)
        return (
          <CircleMarker
            key={loc.id}
            center={[loc.lat, loc.lng]}
            radius={6}
            pathOptions={{
              color: isVisited ? '#2e8b57' : '#d33',
              fillColor: isVisited ? '#2e8b57' : '#d33',
              fillOpacity: 0.85,
              weight: 1,
            }}
          >
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{loc.name}</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>{loc.address}</div>
                <div style={{ fontSize: 12 }}>
                  {loc.city}, {loc.state} {loc.zipcode}
                </div>
                <button
                  type="button"
                  onClick={() => onToggle(loc.id)}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  {isVisited ? 'Mark unvisited' : 'Mark visited'}
                </button>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
