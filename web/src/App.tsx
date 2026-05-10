import { useEffect, useMemo, useState } from 'react'
import '@aws-amplify/ui-react/styles.css'
import { getCurrentUser, signOut } from 'aws-amplify/auth'

import { configureAmplify } from './auth/amplify'
import { useVisits } from './hooks/useVisits'
import { locations as allLocations } from './data/locations'
import { CostcoMap } from './components/CostcoMap'
import { Stats } from './components/Stats'
import { Checklist } from './components/Checklist'
import { ShareModal } from './components/ShareModal'
import { AuthModal } from './components/AuthModal'
import { SecurityModal } from './components/SecurityModal'

configureAmplify()

type View = 'checklist' | 'map'
type Status = '' | 'visited' | 'unvisited'

function MainShell() {
  const [authed, setAuthed] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email?: string } | null>(null)
  const [view, setView] = useState<View>('map')
  const [shareMode, setShareMode] = useState<'general' | 'reddit' | null>(null)
  const [showSecurity, setShowSecurity] = useState(false)
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [status, setStatus] = useState<Status>('')

  const { visited, toggle, syncing, error } = useVisits(authed)

  useEffect(() => {
    getCurrentUser()
      .then((u) => {
        setAuthed(true)
        setUserInfo({ email: u.signInDetails?.loginId })
      })
      .catch(() => setAuthed(false))
  }, [])

  const regions = useMemo(
    () => [...new Set(allLocations.map((l) => l.region))].sort(),
    [],
  )
  const states = useMemo(
    () => [...new Set(allLocations.map((l) => l.state))].sort(),
    [],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allLocations.filter((l) => {
      if (region && l.region !== region) return false
      if (stateFilter && l.state !== stateFilter) return false
      if (status === 'visited' && !visited.has(l.id)) return false
      if (status === 'unvisited' && visited.has(l.id)) return false
      if (!q) return true
      return (
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.state.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      )
    })
  }, [search, region, stateFilter, status, visited])

  return (
    <div className="container">
      <div className="header">
        <h1>🏪 Costco Roadtrip</h1>
        <p className="subtitle">Track your visits to Costco locations across the country</p>

        {!authed && (
          <div className="auth-section">
            <h3>Sign in to sync your progress</h3>
            <p>Keep your Costco quest progress synced across all your devices</p>
            <button
              type="button"
              className="signin-btn"
              onClick={() => setShowAuth(true)}
            >
              Sign in
            </button>
          </div>
        )}
        {authed && (
          <div className="user-info">
            <h3>Welcome back!</h3>
            {userInfo?.email && <p>{userInfo.email}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="signin-btn"
                style={{ background: '#6c757d' }}
                onClick={() => setShowSecurity(true)}
              >
                🔐 Security
              </button>
              <button
                type="button"
                className="signout-btn"
                onClick={async () => {
                  await signOut()
                  setAuthed(false)
                  setUserInfo(null)
                }}
              >
                Sign Out
              </button>
            </div>
            {syncing && <div className="syncing">syncing…</div>}
          </div>
        )}

        <Stats locations={allLocations} visited={visited} />

        <div className="share-row">
          <button
            type="button"
            className="share-btn"
            onClick={() => setShareMode('general')}
          >
            📱 Share Progress
          </button>
          <button
            type="button"
            className="share-btn reddit"
            onClick={() => setShareMode('reddit')}
          >
            🔥 Share on Reddit
          </button>
        </div>

        {error && <div className="error-banner">Sync error: {error}</div>}
      </div>

      {shareMode && (
        <ShareModal
          mode={shareMode}
          locations={allLocations}
          visited={visited}
          onClose={() => setShareMode(null)}
        />
      )}

      {showAuth && !authed && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuthenticated={(email) => {
            setAuthed(true)
            setUserInfo({ email })
            setShowAuth(false)
          }}
        />
      )}

      {showSecurity && authed && (
        <SecurityModal onClose={() => setShowSecurity(false)} />
      )}

      <div className="controls">
        <div className="view-toggle">
          <button
            type="button"
            className={`toggle-btn${view === 'map' ? ' active' : ''}`}
            onClick={() => setView('map')}
          >
            🗺️ Map View
          </button>
          <button
            type="button"
            className={`toggle-btn${view === 'checklist' ? ' active' : ''}`}
            onClick={() => setView('checklist')}
          >
            📋 Checklist View
          </button>
        </div>
        <div className="search-filter">
          <input
            type="search"
            className="search-input"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            <option value="">All Locations</option>
            <option value="visited">Visited Only</option>
            <option value="unvisited">Unvisited Only</option>
          </select>
        </div>
      </div>

      <div className="content">
        {view === 'checklist' ? (
          <Checklist locations={filtered} visited={visited} onToggle={toggle} />
        ) : (
          <div id="map">
            <CostcoMap locations={filtered} visited={visited} onToggle={toggle} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return <MainShell />
}
