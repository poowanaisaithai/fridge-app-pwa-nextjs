'use client';

import React from 'react';
import { Bell, HelpCircle, Download, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenPushManager: () => void;
  onOpenSetupGuide: () => void;
  isPushActive: boolean;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export function Navbar({
  onOpenPushManager,
  onOpenSetupGuide,
  isPushActive,
  canInstallPwa,
  onInstallPwa,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/10 px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-glow-emerald">
            <span className="text-xl">❄️</span>
            <div className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                Fresh<span className="text-brand-400">Fridge</span>
              </h1>
              <span className="hidden rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-semibold text-brand-300 border border-brand-500/20 sm:inline-block">
                100% Free Tier
              </span>
            </div>
            <p className="text-xs text-slate-400">เตือนหมดอายุ 7, 3, วันสุดท้าย + Vision OCR</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button (If available) */}
          {canInstallPwa && onInstallPwa && (
            <button
              onClick={onInstallPwa}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700 hover:bg-slate-700 transition"
              title="ติดตั้งลงเครื่อง (Add to Home Screen)"
            >
              <Download className="h-3.5 w-3.5 text-brand-400" />
              <span className="hidden md:inline">ติดตั้ง App</span>
            </button>
          )}

          {/* Setup Guide Button */}
          <button
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/10 hover:bg-slate-700 hover:text-white transition"
            title="คู่มือการตั้งค่า Firebase us-central1 & VAPID"
          >
            <HelpCircle className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">คู่มือตั้งค่า</span>
          </button>

          {/* Push Notification Button */}
          <button
            onClick={onOpenPushManager}
            className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              isPushActive
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-glow-emerald'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title="ตั้งค่าแจ้งเตือน Web Push (VAPID)"
          >
            <Bell className={`h-4 w-4 ${isPushActive ? 'text-brand-400' : 'text-amber-400'}`} />
            <span className="hidden sm:inline">
              {isPushActive ? 'เปิดแจ้งเตือนแล้ว' : 'ตั้งค่าแจ้งเตือน'}
            </span>
            {isPushActive ? (
              <span className="h-2 w-2 rounded-full bg-brand-400"></span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
