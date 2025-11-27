import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);
const EyeOffIcon = ({ toggle }) => (
    <svg onClick={toggle} style={{ cursor: 'pointer' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.93 4.88M15 12a3 3 0 1 1-6 0"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
);
const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const ChatbotEmblem = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

export default function LoginCard({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function resetStateForMode(nextMode) {
    setError('');
    setBusy(false);
    setName('');
    setPassword('');
    setEmail('');
    setMode(nextMode);
    setShowPassword(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'register') {
        if (name.trim().length < 2) {
          setError('Please enter your name (min 2 chars).');
          setBusy(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setBusy(false);
          return;
        }
        const res = await axios.post(`${API}/api/auth/register`, { name: name.trim(), email: email.trim(), password });
        const token = res?.data?.token;
        if (!token) throw new Error('Registration failed: no token returned.');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(res.data.user || {}));
        if (typeof onLogin === 'function') onLogin();
        return;
      }

      const res = await axios.post(`${API}/api/auth/login`, { email: email.trim(), password });
      const token = res?.data?.token;
      if (!token) throw new Error('Login failed: no token returned.');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(res.data.user || {}));
      if (typeof onLogin === 'function') onLogin();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Authentication failed';
      setError(msg);
      console.error('Auth error:', err);
    } finally {
      setBusy(false);
    }
  }


  const title = mode === 'login' ? 'Sign in to your account' : 'Create your new account';
  const subtitle = mode === 'login' ? 'Access your AI assistant and chat history.' : 'Start using our service with a simple email registration.';
  const buttonText = mode === 'login' ? 'Get Started' : 'Create Account';
  const toggleModeText = mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in';

  return (
    <div className="light-root">
      <div className="card-light glass-effect">
        
        <header className="card-head">
          <div className="emblem" aria-hidden>
            <ChatbotEmblem />
          </div>
          
          <h1 className="brand-title">{title}</h1>
          <p className="brand-sub">{subtitle}</p>
        </header>

        <form className="card-body-light" onSubmit={handleSubmit}>
          {error && <div className="field-error" role="alert">{error}</div>}

          {mode === 'register' && (
            <div className="field-group">
              <div className="input-with-icon">
                <span className="input-icon"><UserIcon /></span>
                <input
                  id="name"
                  className="field-input"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={busy}
                  autoComplete="name"
                />
              </div>
            </div>
          )}
          

          <div className="field-group">
            <div className="input-with-icon">
              <span className="input-icon"><EmailIcon /></span>
              <input
                id="email"
                className="field-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={busy}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="field-group">
            <div className="input-with-icon">
              <span className="input-icon"><LockIcon /></span>
              <input
                id="password"
                className="field-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <span className="input-action-icon">
                 <EyeOffIcon toggle={() => setShowPassword(p => !p)} />
              </span>
            </div>
          </div>
          
          {mode === 'login' && (
              <div className="forgot-password-row">
                  <a href="#" className="link-muted link-right">Forgot password?</a>
              </div>
          )}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? `${buttonText}...` : buttonText}
          </button>
          
          <div className="foot-row centered-footer">
            <button type="button" className="link-text" onClick={() => resetStateForMode(mode === 'login' ? 'register' : 'login')}>
              {toggleModeText}
            </button>
            <div className="small-note">By continuing you agree to our <a href="#" className="note-link">Terms</a>.</div>
          </div>
        </form>
      </div>
    </div>
  );
}