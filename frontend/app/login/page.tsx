'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, User, CheckCircle2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('admin@nightfall.io');
  const [password, setPassword] = useState('nightfall-enterprise');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (authMode === 'register') {
      if (!displayName.trim()) {
        setError('Please enter your full name or display name.');
        return;
      }
      if (!email.trim() || !password) {
        setError('Please provide an email and password.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password.');
        return;
      }

      setLoading(true);
      try {
        await apiClient.register(displayName.trim(), email.trim(), password);
        setSuccessMessage('Account registered successfully! Redirecting to command center...');
        setTimeout(() => {
          router.push('/command-center');
        }, 800);
      } catch (err: any) {
        setError(err?.message || 'Registration failed. Email might already be taken.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setError('Please enter your email and password.');
        return;
      }

      setLoading(true);
      try {
        await apiClient.login(email.trim(), password);
        router.push('/command-center');
      } catch (err: any) {
        setError(err?.message || 'Login failed. Please check credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleQuickDemoLogin = async () => {
    setEmail('admin@nightfall.io');
    setPassword('nightfall-enterprise');
    setLoading(true);
    try {
      await apiClient.login('admin@nightfall.io', 'nightfall-enterprise');
      router.push('/command-center');
    } catch {
      router.push('/command-center');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      const res = await apiClient.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message || 'Password reset link sent to your email.');
    } catch {
      setForgotSuccess('If an account exists for this email, reset instructions have been sent.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nf-bg flex flex-col justify-between p-6 select-none">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <BrandLogo />
        <span className="text-xs font-semibold text-slate-500">
          Smart Printing Operations Platform
        </span>
      </header>

      {/* Center Auth Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl border border-nf-border p-8 shadow-card space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-nf-navy tracking-tight">
              {authMode === 'signin' ? 'Sign In to Command Center' : 'Create Operator Account'}
            </h1>
            <p className="text-xs text-nf-secondary">
              {authMode === 'signin'
                ? 'Enter your credentials to manage or access the kiosk fleet'
                : 'Register a new authenticated profile for smart printing'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${authMode === 'signin'
                  ? 'bg-white text-nf-navy shadow-xs'
                  : 'text-slate-600 hover:text-nf-navy'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError(null);
                setSuccessMessage(null);
                if (email === 'admin@nightfall.io') setEmail('');
                if (password === 'nightfall-enterprise') setPassword('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${authMode === 'register'
                  ? 'bg-white text-nf-navy shadow-xs'
                  : 'text-slate-600 hover:text-nf-navy'
                }`}
            >
              Register New Account
            </button>
          </div>

          {/* Demo Sandbox Alert (shown on signin) */}
          {authMode === 'signin' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-blue-800">Demo Environment Active</span>
                <span className="text-[11px] text-blue-700 block mt-0.5">
                  Use the pre-filled administrator credentials or click below for one-click access.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {authMode === 'register' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jordan Smith"
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={authMode === 'signin' ? 'admin@nightfall.io' : 'jordan@nightfall.io'}
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Password</label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccess(null);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] text-nf-blue hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 pl-10 pr-10 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authMode === 'register' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{authMode === 'signin' ? 'Signing In...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {authMode === 'signin' && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>Instant Demo Admin Access</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-nf-navy">Reset Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2 bg-nf-blue text-white rounded-xl text-xs font-bold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-xs">
                <p className="text-slate-500 text-xs">
                  Enter your registered email address. We will send you instructions to reset your password.
                </p>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@nightfall.io"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2 rounded-xl bg-nf-blue text-white font-bold hover:bg-nf-blue-hover"
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400">
        © 2025 Nightfall Nexus Inc. Enterprise Smart Printing Operations. All rights reserved.
      </footer>
    </div>
  );
}
