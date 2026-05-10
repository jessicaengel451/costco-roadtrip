import type { Location } from '../data/locations'
import { regionInfo } from '../data/regions'

export type ShareFormats = {
  basic: string
  detailed: string
  reddit: string
  redditDetailed: string
  minimal: string
}

function progressBar(current: number, total: number, length = 20): string {
  if (total <= 0) return '░'.repeat(length)
  const filled = Math.round((current / total) * length)
  return '█'.repeat(filled) + '░'.repeat(length - filled)
}

const SITE = 'costcoquest.com'

export function generateShareFormats(
  locations: Location[],
  visited: Set<string>,
  date: Date = new Date(),
): ShareFormats {
  const total = locations.length
  const visitedCount = locations.filter((l) => visited.has(l.id)).length
  const pct = total > 0 ? Math.round((visitedCount / total) * 100) : 0

  const visitedStates = new Set<string>()
  const visitedRegions = new Set<string>()
  const allStates = new Set<string>()
  const allRegions = new Set<string>()
  for (const l of locations) {
    allStates.add(l.state)
    allRegions.add(l.region)
    if (visited.has(l.id)) {
      visitedStates.add(l.state)
      visitedRegions.add(l.region)
    }
  }

  const stateCount = visitedStates.size
  const regionCount = visitedRegions.size
  const stateTotal = allStates.size
  const regionTotal = allRegions.size

  const longBar = progressBar(visitedCount, total, 20)
  const shortBar = progressBar(visitedCount, total, 10)
  const dateStr = date.toLocaleDateString()

  const regionSummary = [...visitedRegions]
    .map((code) => {
      const info = regionInfo(code)
      return `${info.emoji} ${info.name}`
    })
    .sort()
    .join(', ')

  const stateList = [...visitedStates].sort()

  return {
    basic: `🏪 Costco Roadtrip ${dateStr} 🏪

📍 ${visitedCount}/${total} locations (${pct}%)
🗺️ ${stateCount}/${stateTotal} states/provinces · ${regionCount}/${regionTotal} regions visited

Track yours: ${SITE}`,

    detailed: `🏪 Costco Roadtrip Progress 🏪

📊 ${longBar} ${pct}%
📍 ${visitedCount}/${total} locations
🗺️ ${stateCount}/${stateTotal} states/provinces · ${regionCount}/${regionTotal} regions

🌎 Regions: ${regionSummary || 'None yet'}
✅ States: ${stateList.slice(0, 8).join(', ')}${stateList.length > 8 ? ` +${stateList.length - 8} more` : ''}

Share yours: ${SITE}`,

    reddit: `🏪 Costco Roadtrip: ${visitedCount}/${total} locations (${pct}%) across ${stateCount} states/provinces, ${regionCount} regions
${shortBar}
${SITE}`,

    redditDetailed: `🏪 My Costco Progress 🏪

Progress: ${shortBar} ${pct}%
📍 ${visitedCount}/${total} total · 🗺️ ${stateCount}/${stateTotal} states/provinces · 🌎 ${regionCount}/${regionTotal} regions

🌎 Regions conquered: ${regionSummary || 'None yet'}
✅ Top states: ${stateList.slice(0, 6).join(', ')}${stateList.length > 6 ? '...' : ''}

Anyone else tracking theirs? ${SITE}`,

    minimal: `🏪 ${visitedCount}/${total} Costcos (${pct}%) · ${stateCount}/${stateTotal} states · ${regionCount}/${regionTotal} regions · ${SITE}`,
  }
}
