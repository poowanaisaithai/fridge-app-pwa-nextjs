'use client';

import React, { useState } from 'react';
import {
  Bell,
  HelpCircle,
  Download,
  Sparkles,
  Shield,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

interface NavbarProps {
  onOpenPushManager: () => void;
  onOpenSetupGuide: () => void;
  onOpenAdminDashboard: () => void;
  isPushActive: boolean;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export function Navbar({
  onOpenPushManager,
  onOpenSetupGuide,
  onOpenAdminDashboard,
  isPushActive,
  canInstallPwa,
  onInstallPwa,
}: NavbarProps) {
  const { user, userProfile, isAdmin, isLoading, loginWithGoogle, logout } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert(err?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

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
              {isFirebaseConfigured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20" title="เชื่อมต่อ Firebase Firestore เรียบร้อย">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  Cloud Sync
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20" title="ยังไม่เชื่อมต่อ Firebase (บันทึกลง LocalStorage)">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                  Local Mode
                </span>
              )}
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

          {/* Admin Back-Office Button (Only visible for Admins) */}
          {isAdmin && (
            <button
              onClick={onOpenAdminDashboard}
              className="flex items-center gap-1.5 rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-300 border border-violet-500/40 hover:bg-violet-500/30 transition shadow-glow-violet"
              title="เปิดหน้าจัดการระบบหลังบ้าน (Admin Console)"
            >
              <Shield className="h-4 w-4 text-violet-400" />
              <span className="hidden sm:inline">จัดการหลังบ้าน</span>
            </button>
          )}

          {/* Setup Guide Button */}
          <button
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/10 hover:bg-slate-700 hover:text-white transition"
            title="คู่มือการตั้งค่า Firebase us-central1 & VAPID"
          >
            <HelpCircle className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">คู่มือ</span>
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
              {isPushActive ? 'เปิดแจ้งเตือนแล้ว' : 'แจ้งเตือน'}
            </span>
            {isPushActive ? (
              <span className="h-2 w-2 rounded-full bg-brand-400"></span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>

          {/* User Auth Section */}
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-slate-800 animate-pulse flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-full p-1 border border-white/10 bg-slate-800/60 hover:bg-slate-800 transition"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-7 w-7 rounded-full object-cover border border-brand-400/50"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-medium text-slate-200 pr-2">
                  {user.displayName?.split(' ')[0] || 'สมาชิก'}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs font-bold text-white truncate">
                      {user.displayName || 'ผู้ใช้งาน'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5">
                      {isAdmin ? (
                        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                          👑 ผู้ดูแล (Admin)
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                          สมาชิกในบ้าน (Member)
                        </span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={onOpenAdminDashboard}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition"
                    >
                      <Shield className="h-4 w-4 text-violet-400" />
                      หน้าจัดการหลังบ้าน
                    </button>
                  )}

                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition"
                  >
                    <LogOut className="h-4 w-4 text-rose-400" />
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-slate-100 transition shadow-sm active:scale-95 disabled:opacity-50"
              title="เข้าสู่ระบบด้วย Google"
            >
              {isLoggingIn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
