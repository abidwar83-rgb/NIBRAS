import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: User) => void;
  c: any;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  c
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.register(name, email, password, role);
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(demoEmail, demoPass);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        id="auth-modal-dialog"
        style={{
          width: "100%",
          maxWidth: 440,
          background: c.paper,
          borderRadius: 12,
          border: `1px solid ${c.line}`,
          boxShadow: "0 16px 36px rgba(0,0,0,0.25)",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${c.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: c.paper2
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Source Serif 4', Georgia, serif",
                fontSize: 20,
                fontWeight: 700,
                color: c.ink,
                margin: 0
              }}
            >
              {mode === 'login' ? 'Sign in to Nibras' : 'Create your account'}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: c.inkSoft }}>
              Access your purchased eBooks, reading progress, and AI assistant
            </p>
          </div>
          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: c.inkSoft,
              cursor: "pointer",
              padding: 4
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: "24px" }}>
          {error && (
            <div
              id="auth-error-banner"
              style={{
                padding: "10px 14px",
                borderRadius: 6,
                background: `${c.danger}15`,
                border: `1px solid ${c.danger}30`,
                color: c.danger,
                fontSize: 13,
                marginBottom: 16
              }}
            >
              {error}
            </div>
          )}

          {/* Quick Demo Logins */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: c.inkSoft, marginBottom: 8 }}>
              Quick Demo Access
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button
                type="button"
                id="demo-customer-btn"
                onClick={() => handleDemoLogin('aarav.mehta@example.com', 'customer123')}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${c.line}`,
                  background: c.card,
                  color: c.ink,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <UserIcon size={14} color={c.ink2} />
                <span>Customer</span>
              </button>
              <button
                type="button"
                id="demo-admin-btn"
                onClick={() => handleDemoLogin('admin@nibras.com', 'admin123')}
                style={{
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${c.brass}`,
                  background: `${c.brass}15`,
                  color: c.brass,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <Shield size={14} />
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: c.line }} />
            <span style={{ fontSize: 11, color: c.inkSoft }}>or enter credentials</span>
            <div style={{ flex: 1, height: 1, background: c.line }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <UserIcon size={15} style={{ position: "absolute", left: 10, top: 11, color: c.inkSoft }} />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 34px",
                      borderRadius: 6,
                      border: `1px solid ${c.line}`,
                      background: c.paper2,
                      color: c.ink,
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 10, top: 11, color: c.inkSoft }} />
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reader@example.com"
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: 6,
                    border: `1px solid ${c.line}`,
                    background: c.paper2,
                    color: c.ink,
                    fontSize: 13,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={15} style={{ position: "absolute", left: 10, top: 11, color: c.inkSoft }} />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 34px",
                    borderRadius: 6,
                    border: `1px solid ${c.line}`,
                    background: c.paper2,
                    color: c.ink,
                    fontSize: 13,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: c.ink2, marginBottom: 4 }}>
                  Account Role
                </label>
                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.ink, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="role"
                      value="CUSTOMER"
                      checked={role === 'CUSTOMER'}
                      onChange={() => setRole('CUSTOMER')}
                    />
                    Customer
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c.ink, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="role"
                      value="ADMIN"
                      checked={role === 'ADMIN'}
                      onChange={() => setRole('ADMIN')}
                    />
                    Administrator
                  </label>
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "10px",
                borderRadius: 6,
                border: "none",
                background: c.brass,
                color: "#F2EFE6",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }}
            >
              {loading ? "Please wait..." : (mode === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </form>

          {/* Toggle mode */}
          <div style={{ marginTop: 18, textAlign: "center", fontSize: 12.5, color: c.inkSoft }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  id="switch-to-register-btn"
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: c.brass,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Create one now
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  id="switch-to-login-btn"
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: c.brass,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
