'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Server,
  Save,
  Check,
  ChevronRight,
  Database,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const { showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'fleet' | 'system'>(
    'profile'
  );

  // Profile form
  const [name, setName] = useState('Admin');
  const [email, setEmail] = useState('admin@nightfall.io');
  const [role, setRole] = useState('System Administrator');

  // Notifications
  const [notifyHardwareErrors, setNotifyHardwareErrors] = useState(true);
  const [notifyThermalSpikes, setNotifyThermalSpikes] = useState(true);
  const [notifyPrintCompleted, setNotifyPrintCompleted] = useState(false);

  // Fleet config
  const [defaultColorRate, setDefaultColorRate] = useState('0.35');
  const [defaultBWRate, setDefaultBWRate] = useState('0.08');
  const [maxPagesPerJob, setMaxPagesPerJob] = useState('100');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nightfall_settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.name) setName(parsed.name);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.defaultColorRate) setDefaultColorRate(parsed.defaultColorRate);
        if (parsed.defaultBWRate) setDefaultBWRate(parsed.defaultBWRate);
        if (parsed.maxPagesPerJob) setMaxPagesPerJob(parsed.maxPagesPerJob);
      }
    } catch {}
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(
        'nightfall_settings',
        JSON.stringify({
          name,
          email,
          defaultColorRate,
          defaultBWRate,
          maxPagesPerJob,
          notifyHardwareErrors,
          notifyThermalSpikes,
          notifyPrintCompleted,
        })
      );
    } catch {}
    showToast('Settings saved successfully and persisted.');
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 select-none">
        {/* Header */}
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-nf-secondary font-medium mb-1.5">
            <Link href="/command-center" className="hover:text-nf-navy transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-nf-navy font-semibold">Settings</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
            System & Fleet Settings
          </h1>
          <p className="text-xs md:text-sm text-nf-secondary mt-0.5">
            Configure administrator profile, dispatch thresholds, notification triggers, and API connections
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
          {[
            { id: 'profile', label: 'Admin Profile', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'fleet', label: 'Fleet & Pricing', icon: Server },
            { id: 'system', label: 'System Info', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-nf-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Admin Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-5">
            <h2 className="text-base font-bold text-nf-navy">Administrator Profile</h2>

            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
                AD
              </div>
              <div>
                <span className="text-sm font-bold text-slate-800 block">Admin</span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Super Administrator • Full Fleet Authority
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Administrative Role</label>
                <input
                  type="text"
                  disabled
                  value={role}
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Expiration</label>
                <input
                  type="text"
                  disabled
                  value="8 hours (MFA Enforced)"
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-nf-navy">Hardware & Incident Alerts</h2>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Critical Hardware Errors</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Trigger audio cue and dashboard alert whenever a kiosk reports paper jams or optical faults.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyHardwareErrors}
                  onChange={(e) => setNotifyHardwareErrors(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Thermal Core Warnings</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Send immediate notification when kiosk fuser temperature exceeds 40°C threshold.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyThermalSpikes}
                  onChange={(e) => setNotifyThermalSpikes(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Job Completion Chimes</span>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    Notify operators when high-volume commercial print jobs finish rendering.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyPrintCompleted}
                  onChange={(e) => setNotifyPrintCompleted(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notification Rules</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Fleet & Pricing */}
        {activeTab === 'fleet' && (
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-nf-navy">Fleet Defaults & Standard Pricing</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Color Rate ($/page)</label>
                <input
                  type="number"
                  step="0.01"
                  value={defaultColorRate}
                  onChange={(e) => setDefaultColorRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">B&W Rate ($/page)</label>
                <input
                  type="number"
                  step="0.01"
                  value={defaultBWRate}
                  onChange={(e) => setDefaultBWRate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Max Pages Per Order</label>
                <input
                  type="number"
                  value={maxPagesPerJob}
                  onChange={(e) => setMaxPagesPerJob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Fleet Policy</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: System Info */}
        {activeTab === 'system' && (
          <div className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-nf-navy">Environment & Architecture</h2>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Application Name</span>
                <span className="font-bold text-slate-900">Nightfall Nexus Enterprise</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Release Version</span>
                <span className="font-mono font-bold text-nf-blue">v1.0.0-production</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Theme Target</span>
                <span className="font-bold text-emerald-600">Strict Premium Light Theme</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Three.js Graphics Acceleration</span>
                <span className="font-bold text-slate-800">WebGL 2.0 (Three.js r186)</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-400">Backend API URL</span>
                <span className="font-mono text-slate-600">
                  {process.env.NEXT_PUBLIC_API_URL || 'Self-Contained Demo Environment'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

