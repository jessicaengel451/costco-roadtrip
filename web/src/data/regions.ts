// Region code → display name + emoji.
// Codes used by the locations CSV; preserved from the original index.html ALL_REGIONS map.

export type RegionInfo = { name: string; emoji: string }

export const REGIONS: Record<string, RegionInfo> = {
  // US
  NE: { name: 'Northeast', emoji: '🗽' },
  SE: { name: 'Southeast', emoji: '🏖️' },
  MW: { name: 'Midwest', emoji: '🌾' },
  NW: { name: 'Northwest', emoji: '🏔️' },
  TE: { name: 'Texas', emoji: '🤠' },
  SW: { name: 'Southwest', emoji: '🌵' },
  BA: { name: 'Bay Area', emoji: '🌉' },
  LA: { name: 'Los Angeles', emoji: '🌴' },
  SD: { name: 'San Diego', emoji: '☀️' },
  CC: { name: 'Central California', emoji: '🍇' },

  // Canada / Mexico / international
  EC: { name: 'Eastern Canada', emoji: '🍁' },
  WC: { name: 'Western Canada', emoji: '🏔️' },
  CB: { name: 'Central Canada', emoji: '🌾' },
  ON: { name: 'Ontario', emoji: '🏙️' },
  'MX-NO': { name: 'Northern Mexico', emoji: '🌮' },
  'MX-CE': { name: 'Central Mexico', emoji: '🌮' },
  'MX-SU': { name: 'Southern Mexico', emoji: '🌮' },
  'JP-KA': { name: 'Japan - Kanto', emoji: '🗾' },
  'JP-KI': { name: 'Japan - Kansai', emoji: '🗾' },
  'JP-CH': { name: 'Japan - Chubu', emoji: '🗾' },
  'JP-KY': { name: 'Japan - Kyushu', emoji: '🗾' },
  'JP-TO': { name: 'Japan - Other', emoji: '🗾' },
  'JP-HO': { name: 'Japan - Other', emoji: '🗾' },
  'JP-OT': { name: 'Japan - Other', emoji: '🗾' },
  'KO-SE': { name: 'South Korea - Seoul', emoji: '🇰🇷' },
  'KO-BS': { name: 'South Korea - Busan', emoji: '🇰🇷' },
  'KO-CE': { name: 'South Korea - Central', emoji: '🇰🇷' },
  'KO-OT': { name: 'South Korea - Central', emoji: '🇰🇷' },
  'TW-NO': { name: 'Taiwan - North', emoji: '🇹🇼' },
  'TW-CE': { name: 'Taiwan - Central', emoji: '🇹🇼' },
}

export function regionInfo(code: string): RegionInfo {
  return REGIONS[code] ?? { name: code, emoji: '📍' }
}
