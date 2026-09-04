'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show if user already dismissed recently
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Also check if app is already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between gap-3 rounded-2xl glass-panel p-3.5 border border-brand-500/30 shadow-glow-emerald backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white shadow-md">
            <span className="text-xl">❄️</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>ติดตั้ง FreshFridge App</span>
              <Sparkles className="h-3 w-3 text-amber-300" />
            </h4>
            <p className="text-[11px] text-slate-300">
              ใช้งานเสมือนแอปจริงบนหน้าจอโฮม พร้อมรับการแจ้งเตือน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 rounded-xl bg-brand-500 px-3 py-1.5 text-xs font-bold text-white shadow-glow-emerald hover:bg-brand-400 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>ติดตั้ง</span>
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
            title="ปิด"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
