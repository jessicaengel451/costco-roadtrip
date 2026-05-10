import { useEffect, useState } from 'react'
import {
  setUpTOTP,
  verifyTOTPSetup,
  fetchMFAPreference,
  updateMFAPreference,
  associateWebAuthnCredential,
  listWebAuthnCredentials,
  deleteWebAuthnCredential,
} from 'aws-amplify/auth'

type Props = {
  onClose: () => void
}

type TotpState =
  | { kind: 'idle' }
  | { kind: 'setup'; uri: string; sharedSecret: string }
  | { kind: 'verifying'; uri: string; sharedSecret: string; code: string; error?: string }
  | { kind: 'enabled' }

type Passkey = { credentialId: string; friendlyCredentialName?: string; createdAt?: string }

export function SecurityModal({ onClose }: Props) {
  const [totp, setTotp] = useState<TotpState>({ kind: 'idle' })
  const [totpEnabled, setTotpEnabled] = useState<boolean | null>(null)
  const [passkeys, setPasskeys] = useState<Passkey[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setError(null)
    try {
      const [pref, list] = await Promise.all([
        fetchMFAPreference(),
        listWebAuthnCredentials().catch(() => ({ credentials: [] })),
      ])
      setTotpEnabled(pref.enabled?.includes('TOTP') ?? false)
      setPasskeys((list.credentials ?? []) as Passkey[])
    } catch (e) {
      setError(String(e))
    }
  }

  async function startTotpSetup() {
    setError(null)
    setBusy(true)
    try {
      const result = await setUpTOTP()
      // result.getSetupUri(appName, accountName) returns an otpauth:// URI
      const uri = result.getSetupUri('Costco Roadtrip').toString()
      setTotp({ kind: 'setup', uri, sharedSecret: result.sharedSecret })
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function confirmTotp() {
    if (totp.kind !== 'verifying') return
    setBusy(true)
    setError(null)
    try {
      await verifyTOTPSetup({ code: totp.code })
      await updateMFAPreference({ totp: 'PREFERRED' })
      setTotp({ kind: 'enabled' })
      await refresh()
    } catch (e) {
      setTotp({ ...totp, error: String(e) })
    } finally {
      setBusy(false)
    }
  }

  async function disableTotp() {
    if (!confirm('Disable authenticator app MFA?')) return
    setBusy(true)
    setError(null)
    try {
      await updateMFAPreference({ totp: 'DISABLED' })
      setTotp({ kind: 'idle' })
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function addPasskey() {
    setBusy(true)
    setError(null)
    try {
      await associateWebAuthnCredential()
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function removePasskey(credentialId: string) {
    if (!confirm('Remove this passkey?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteWebAuthnCredential({ credentialId })
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Security settings"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-content compact">
        <div className="modal-header">
          <h2 className="modal-title">🔐 Security</h2>
          <button
            type="button"
            className="close"
            onClick={onClose}
            aria-label="Close security dialog"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {error && <div className="error-banner">{error}</div>}

          {/* ---------- TOTP ---------- */}
          <div className="format-option">
            <div className="format-header">
              <span>📱 Authenticator app (2FA)</span>
              {totpEnabled ? (
                <button
                  type="button"
                  className="copy-format-btn"
                  style={{ background: '#dc3545' }}
                  onClick={disableTotp}
                  disabled={busy}
                >
                  Disable
                </button>
              ) : (
                <button
                  type="button"
                  className="copy-format-btn"
                  onClick={startTotpSetup}
                  disabled={busy || totp.kind !== 'idle'}
                >
                  Set up
                </button>
              )}
            </div>
            <div className="format-content" style={{ fontFamily: 'inherit' }}>
              {totpEnabled && totp.kind !== 'verifying' && totp.kind !== 'setup' && (
                <p>Authenticator app is enabled. You'll be prompted for a code on sign-in.</p>
              )}
              {!totpEnabled && totp.kind === 'idle' && (
                <p>
                  Use an app like Google Authenticator, Authy, 1Password, or Bitwarden to
                  generate a 6-digit code on sign-in.
                </p>
              )}
              {totp.kind === 'setup' && (
                <div>
                  <p style={{ marginBottom: 8 }}>
                    Add this account to your authenticator app, then enter the code it shows.
                  </p>
                  <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 12 }}>
                    Setup URI: {totp.uri}
                  </p>
                  <p style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 4 }}>
                    Or enter this secret manually: <strong>{totp.sharedSecret}</strong>
                  </p>
                  <button
                    type="button"
                    className="copy-format-btn"
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      setTotp({
                        kind: 'verifying',
                        uri: totp.uri,
                        sharedSecret: totp.sharedSecret,
                        code: '',
                      })
                    }
                  >
                    I've added it — enter code
                  </button>
                </div>
              )}
              {totp.kind === 'verifying' && (
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder="6-digit code"
                    value={totp.code}
                    onChange={(e) => setTotp({ ...totp, code: e.target.value })}
                    style={{ padding: '8px 12px', fontSize: 16, marginRight: 8 }}
                  />
                  <button
                    type="button"
                    className="copy-format-btn"
                    onClick={confirmTotp}
                    disabled={busy || totp.code.length < 6}
                  >
                    Verify
                  </button>
                  {totp.error && (
                    <div className="error-banner" style={{ marginTop: 8 }}>
                      {totp.error}
                    </div>
                  )}
                </div>
              )}
              {totp.kind === 'enabled' && <p>✅ Authenticator app added.</p>}
            </div>
          </div>

          {/* ---------- Passkeys ---------- */}
          <div className="format-option">
            <div className="format-header">
              <span>🔑 Passkeys</span>
              <button
                type="button"
                className="copy-format-btn"
                onClick={addPasskey}
                disabled={busy}
              >
                Add passkey
              </button>
            </div>
            <div className="format-content" style={{ fontFamily: 'inherit' }}>
              <p style={{ marginBottom: 8 }}>
                Use Apple Passkeys, Bitwarden, 1Password, a hardware key, or any
                WebAuthn-compatible authenticator. Sign in without a password.
              </p>
              {passkeys === null && <p>Loading…</p>}
              {passkeys && passkeys.length === 0 && <p>No passkeys yet.</p>}
              {passkeys && passkeys.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {passkeys.map((p) => (
                    <li
                      key={p.credentialId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {p.friendlyCredentialName ?? 'Passkey'}
                        </div>
                        {p.createdAt && (
                          <div style={{ fontSize: 12, color: '#666' }}>
                            Added {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="copy-format-btn"
                        style={{ background: '#dc3545' }}
                        onClick={() => removePasskey(p.credentialId)}
                        disabled={busy}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
