"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to register. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .reg-root {
          min-height: 100vh;
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        .bg-layer {
          position: absolute;
          inset: 0;
          background-image: url('/bg.png');
          background-size: cover;
          background-position: center;
          z-index: 0;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            rgba(0,0,0,0.18) 0%,
            rgba(0,0,0,0.30) 40%,
            rgba(0,10,8,0.82) 100%
          );
          z-index: 1;
        }

        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%);
          z-index: 2;
        }

        .brand-badge {
          position: absolute;
          top: 36px;
          left: 44px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: fadeSlideDown 0.7s ease both;
        }

        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.28);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2.1rem;
          letter-spacing: 0.12em;
          color: #fff;
          line-height: 1;
          text-shadow: 0 2px 18px rgba(0,0,0,0.4);
        }

        .tagline {
          position: absolute;
          bottom: 48px;
          left: 44px;
          z-index: 10;
          max-width: 480px;
          animation: fadeSlideUp 0.8s 0.2s ease both;
        }

        .tagline-sub {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.55rem;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.92);
          margin-bottom: 8px;
          text-shadow: 0 1px 12px rgba(0,0,0,0.5);
        }

        .tagline-body {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.65);
          line-height: 1.65;
          font-weight: 300;
          max-width: 400px;
        }

        .status-chips {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          flex-wrap: wrap;
        }

        .chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.8);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00e5c9;
          box-shadow: 0 0 6px #00e5c9;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Glass panel — slightly wider for register due to extra fields */
        .glass-panel {
          position: relative;
          z-index: 10;
          width: 420px;
          margin-right: 64px;
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(28px) saturate(1.6);
          -webkit-backdrop-filter: blur(28px) saturate(1.6);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0,0,0,0.45),
            0 1px 0 rgba(255,255,255,0.12) inset,
            0 -1px 0 rgba(0,0,0,0.2) inset;
          animation: fadeSlideLeft 0.75s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
          /* allow scroll if viewport is short */
          max-height: 96vh;
          overflow-y: auto;
          scrollbar-width: none;
        }

        .glass-panel::-webkit-scrollbar { display: none; }

        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #009688, #00bfa5, #64ffda);
          position: sticky;
          top: 0;
          z-index: 5;
        }

        .panel-header {
          padding: 28px 36px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .panel-header h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 2rem;
          letter-spacing: 0.06em;
          color: #fff;
          line-height: 1;
          margin-bottom: 5px;
        }

        .panel-header p {
          font-size: 0.82rem;
          color: rgba(255,255,255,0.5);
          font-weight: 300;
        }

        .panel-body {
          padding: 22px 36px 30px;
        }

        .tab-toggle {
          display: flex;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 22px;
          gap: 4px;
        }

        .tab-btn {
          flex: 1;
          text-align: center;
          padding: 9px 0;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-decoration: none;
          transition: all 0.22s ease;
          cursor: pointer;
        }

        .tab-btn.active {
          background: rgba(0,150,136,0.85);
          color: #fff;
          box-shadow: 0 2px 12px rgba(0,150,136,0.4);
        }

        .tab-btn.inactive {
          color: rgba(255,255,255,0.45);
        }

        .tab-btn.inactive:hover {
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.06);
        }

        .field-group {
          margin-bottom: 14px;
        }

        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .field-wrapper {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.35);
          pointer-events: none;
          display: flex;
        }

        .field-input {
          width: 100%;
          background: rgba(255,255,255,0.07) !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 10px !important;
          height: 46px !important;
          padding-left: 44px !important;
          padding-right: 14px !important;
          font-size: 0.88rem !important;
          color: #fff !important;
          font-family: 'DM Sans', sans-serif !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }

        .field-input::placeholder {
          color: rgba(255,255,255,0.25) !important;
        }

        .field-input:focus {
          outline: none !important;
          border-color: rgba(0,150,136,0.7) !important;
          box-shadow: 0 0 0 3px rgba(0,150,136,0.15) !important;
          background: rgba(255,255,255,0.10) !important;
        }

        .eye-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.35);
          display: flex;
          padding: 0;
          transition: color 0.2s;
        }

        .eye-toggle:hover { color: rgba(255,255,255,0.7); }

        /* Password strength bar */
        .strength-bar {
          display: flex;
          gap: 4px;
          margin-top: 7px;
        }

        .strength-seg {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: rgba(255,255,255,0.1);
          transition: background 0.3s;
        }

        .strength-label {
          font-size: 0.68rem;
          margin-top: 4px;
          font-weight: 500;
          letter-spacing: 0.04em;
        }

        /* Terms checkbox */
        .terms-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          margin-top: 4px;
        }

        .custom-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.06);
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s;
          appearance: none;
          -webkit-appearance: none;
          position: relative;
        }

        .custom-checkbox:checked {
          background: #009688;
          border-color: #009688;
        }

        .custom-checkbox:checked::after {
          content: '';
          position: absolute;
          width: 5px;
          height: 9px;
          border: 2px solid #fff;
          border-top: none;
          border-left: none;
          transform: rotate(42deg) translate(-1px, -1px);
        }

        .terms-label {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.5);
          font-weight: 400;
          line-height: 1.4;
          cursor: pointer;
        }

        .terms-label a {
          color: rgba(0,230,200,0.85);
          font-weight: 500;
          text-decoration: none;
        }

        .submit-btn {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #009688 0%, #00bfa5 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(0,150,136,0.4), 0 1px 0 rgba(255,255,255,0.15) inset;
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent);
          opacity: 0;
          transition: opacity 0.22s;
        }

        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 26px rgba(0,150,136,0.5); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 18px 0;
        }

        .sys-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sys-label {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.04em;
        }

        .sys-live {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: rgba(100,255,210,0.7);
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #64ffda;
          box-shadow: 0 0 6px #64ffda;
          animation: pulse 1.8s infinite;
        }

        .login-row {
          text-align: center;
          margin-top: 14px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.38);
        }

        .login-row a {
          color: rgba(0,230,200,0.85);
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-row a:hover { color: #64ffda; }

        .error-box {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.35);
          border-radius: 10px;
          padding: 11px 14px;
          font-size: 0.8rem;
          color: #fca5a5;
          text-align: center;
          margin-bottom: 16px;
        }

        @keyframes fadeSlideLeft {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 640px) {
          .glass-panel { width: calc(100% - 40px); margin: 20px; }
          .brand-badge { left: 20px; top: 20px; }
          .tagline { display: none; }
        }
      `}</style>

      <div className="reg-root">
        <div className="bg-layer" />
        <div className="overlay" />
        <div className="vignette" />

        {/* Brand badge */}
        <div className="brand-badge">
          <div className="brand-icon">
            <Leaf style={{ width: 20, height: 20, color: '#64ffda' }} />
          </div>
          <span className="brand-name">SANOTA</span>
        </div>

        {/* Bottom-left tagline */}
        <div className="tagline">
          <div className="tagline-sub">Tea Factory Louver Control System</div>
          <p className="tagline-body">
            Precision automated control for optimal tea withering. Monitor and adjust louvers
            in real-time for perfect air circulation, temperature, and humidity.
          </p>
          <div className="status-chips">
            <div className="chip"><span className="chip-dot" />System Online</div>
            <div className="chip">12 Active Zones</div>
            <div className="chip">Auto Mode</div>
          </div>
        </div>

        {/* Glass register panel */}
        <div className="glass-panel">
          <div className="accent-bar" />

          <div className="panel-header">
            <h2>Create Account</h2>
            <p>Register to access the control panel</p>
          </div>

          <div className="panel-body">
            {/* Tab toggle */}
            <div className="tab-toggle">
              <Link href="/login" className="tab-btn inactive">Login</Link>
              <Link href="/register" className="tab-btn active">Register</Link>
            </div>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleRegister}>
              <div className="field-group">
                <label className="field-label" htmlFor="email">Email Address</label>
                <div className="field-wrapper">
                  <span className="field-icon"><Mail size={16} /></span>
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@sanota.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="field-input"
                  />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="password">Password</label>
                <div className="field-wrapper">
                  <span className="field-icon"><Lock size={16} /></span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="field-input"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password.length > 0 && (() => {
                  const len = password.length;
                  const strength = len < 6 ? 1 : len < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
                  const colors = ['', '#ef4444', '#f59e0b', '#22c55e', '#00bfa5'];
                  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very Strong'];
                  return (
                    <div>
                      <div className="strength-bar">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="strength-seg" style={{ background: i <= strength ? colors[strength] : undefined }} />
                        ))}
                      </div>
                      <div className="strength-label" style={{ color: colors[strength] }}>{labels[strength]}</div>
                    </div>
                  );
                })()}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="confirm-password">Confirm Password</label>
                <div className="field-wrapper">
                  <span className="field-icon"><Lock size={16} /></span>
                  <input
                    id="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="field-input"
                    style={{
                      paddingRight: '44px',
                      borderColor: confirmPassword && confirmPassword !== password
                        ? 'rgba(239,68,68,0.6)'
                        : confirmPassword && confirmPassword === password
                        ? 'rgba(0,191,165,0.6)'
                        : undefined
                    }}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5', marginTop: '5px', fontWeight: 500 }}>
                    Passwords do not match
                  </div>
                )}
                {confirmPassword && confirmPassword === password && (
                  <div style={{ fontSize: '0.72rem', color: '#64ffda', marginTop: '5px', fontWeight: 500 }}>
                    ✓ Passwords match
                  </div>
                )}
              </div>

              <div className="terms-row">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="custom-checkbox"
                />
                <label htmlFor="terms" className="terms-label">
                  I agree to the <a href="#">terms of service</a> and <a href="#">privacy policy</a>
                </label>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <><div className="spinner" /> Creating Account...</>
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className="divider" />

            <div className="sys-status">
              <span className="sys-label">© 2026 SANOTA</span>
              <span className="sys-live"><span className="live-dot" />LIVE</span>
            </div>

            <div className="login-row">
              Already have an account? <Link href="/login">Login here</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}