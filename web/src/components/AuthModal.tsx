import { useEffect } from 'react'
import { Authenticator } from '@aws-amplify/ui-react'

type Props = {
  onClose: () => void
  onAuthenticated: (email: string | undefined) => void
}

export function AuthModal({ onClose, onAuthenticated }: Props) {
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
      aria-label="Sign in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content compact auth-modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Sign in to sync your progress</h2>
          <button
            type="button"
            className="close"
            onClick={onClose}
            aria-label="Close sign-in dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body auth-modal-body">
          <Authenticator socialProviders={['google']}>
            {({ user }) => {
              if (user) {
                onAuthenticated(user.signInDetails?.loginId)
              }
              return <div className="empty">Signing you in…</div>
            }}
          </Authenticator>
        </div>
      </div>
    </div>
  )
}
