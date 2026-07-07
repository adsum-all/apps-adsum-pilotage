import { useState } from "react";

import { ApiError, type Session, login } from "../api.js";

interface LoginProps {
  onAuth: (session: Session) => void;
}

const ALLOWED = new Set(["direction", "admin", "super_admin"]);

export function Login({ onAuth }: LoginProps): JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login(email, password);
      if (!ALLOWED.has(session.role)) {
        setError("Accès réservé à la direction.");
        return;
      }
      onAuth(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur réseau");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <form onSubmit={submit} className="auth-card">
        <div className="brand brand-lg">
          <span className="brand-logo" aria-hidden="true">
            A
          </span>
          <span className="brand-text">
            ADSUM
            <span className="brand-sub">Direction</span>
          </span>
        </div>
        <label>
          <span>Courriel</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          <span>Mot de passe</span>
          <div className="pw-field">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="pw-toggle"
              aria-pressed={showPassword}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.24A9.1 9.1 0 0112 4c5 0 9 4.5 10 8a13 13 0 01-2.3 3.5M6.1 6.1C3.9 7.6 2.5 9.7 2 12c1 3.5 5 8 10 8a9.3 9.3 0 004.1-.9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M2 12c1-3.5 5-8 10-8s9 4.5 10 8c-1 3.5-5 8-10 8s-9-4.5-10-8z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              )}
            </button>
          </div>
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Connexion..." : "Se connecter"}
        </button>
        <p className="muted small center">Vue consolidée, lecture seule.</p>
      </form>
    </div>
  );
}
