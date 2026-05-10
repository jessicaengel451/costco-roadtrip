import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchVisits, putVisits } from '../api/client'

const STORAGE_KEY = 'costco-roadtrip:visited'

function loadLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function saveLocal(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function mergeVisits(local: Iterable<string>, remote: Iterable<string>): Set<string> {
  return new Set([...local, ...remote])
}

export function useVisits(authed: boolean) {
  const [visited, setVisited] = useState<Set<string>>(() => loadLocal())
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flushTimer = useRef<number | null>(null)
  const pendingFlush = useRef<Set<string> | null>(null)

  // On auth change, hydrate from API and merge with local.
  useEffect(() => {
    if (!authed) return
    let cancelled = false
    setSyncing(true)
    fetchVisits()
      .then((remote) => {
        if (cancelled) return
        setVisited((cur) => {
          const merged = mergeVisits(cur, remote)
          saveLocal(merged)
          // If the merge added local-only entries, push them up.
          if (merged.size !== remote.length) {
            void putVisits([...merged]).catch((e) => setError(String(e)))
          }
          return merged
        })
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setSyncing(false))
    return () => {
      cancelled = true
    }
  }, [authed])

  const scheduleFlush = useCallback(
    (ids: Set<string>) => {
      if (!authed) return
      pendingFlush.current = ids
      if (flushTimer.current != null) window.clearTimeout(flushTimer.current)
      flushTimer.current = window.setTimeout(() => {
        const toSend = pendingFlush.current
        pendingFlush.current = null
        if (!toSend) return
        setSyncing(true)
        putVisits([...toSend])
          .catch((e) => setError(String(e)))
          .finally(() => setSyncing(false))
      }, 800)
    },
    [authed],
  )

  const toggle = useCallback(
    (id: string) => {
      setVisited((cur) => {
        const next = new Set(cur)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        saveLocal(next)
        scheduleFlush(next)
        return next
      })
    },
    [scheduleFlush],
  )

  return { visited, toggle, syncing, error }
}
