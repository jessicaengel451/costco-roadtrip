import { useEffect, useMemo, useState } from 'react'
import type { Location } from '../data/locations'
import { generateShareFormats, type ShareFormats } from '../share/formats'

type Mode = 'general' | 'reddit'

type Props = {
  mode: Mode
  locations: Location[]
  visited: Set<string>
  onClose: () => void
}

const GENERAL_PANELS: Array<{ key: keyof ShareFormats; title: string }> = [
  { key: 'basic', title: '📱 Basic Share' },
  { key: 'detailed', title: '📊 Detailed Progress' },
  { key: 'redditDetailed', title: '🔥 Reddit Ready' },
]

const REDDIT_PANELS: Array<{ key: keyof ShareFormats; title: string }> = [
  { key: 'reddit', title: '🔥 Reddit Comment Format' },
  { key: 'redditDetailed', title: '📝 Reddit Post Format' },
  { key: 'minimal', title: '⚡ One-Line Format' },
]

export function ShareModal({ mode, locations, visited, onClose }: Props) {
  const formats = useMemo(
    () => generateShareFormats(locations, visited),
    [locations, visited],
  )
  const panels = mode === 'reddit' ? REDDIT_PANELS : GENERAL_PANELS

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Share your progress"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'reddit' ? '🔥 Share on Reddit' : '📱 Share Your Progress'}
          </h2>
          <button
            type="button"
            className="close"
            onClick={onClose}
            aria-label="Close share dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {panels.map(({ key, title }) => (
            <Panel key={key} title={title} text={formats[key]} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Panel({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="format-option">
      <div className="format-header">
        <span>{title}</span>
        <button
          type="button"
          className={`copy-format-btn${copied ? ' copied' : ''}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            } catch {
              // ignore — older browsers without clipboard support
            }
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="format-content">{text}</pre>
    </div>
  )
}
