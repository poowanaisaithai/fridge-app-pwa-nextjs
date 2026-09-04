'use client';

import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'firebase' | 'vapid' | 'vercel'>('firebase');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl glass-panel border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                คู่มือการตั้งค่าระบบ (100% Free Tier)
              </h2>
              <p className="text-xs text-slate-400">Firebase (us-central1) + VAPID Web Push + Vercel Cron</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/5 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === 'firebase'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>1. Firebase (us-central1)</span>
          </button>
          <button
            onClick={() => setActiveTab('vapid')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === 'vapid'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>2. VAPID Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition ${
              activeTab === 'vercel'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>3. Vercel Cron Deploy</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* TAB 1: FIREBASE */}
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              {/* Region Warning Alert */}
              <div className="rounded-2xl bg-amber-500/10 p-4 border border-amber-500/30 text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                  <span>กฎเหล็ก Free Tier: ต้องเลือกภูมิภาค `us-central1` (nam5) เท่านั้น!</span>
                </div>
                <p className="text-[11px] text-amber-200/90 pl-7">
                  Firebase ให้สิทธิ์ฟรีถาวร (Firestore 1GB, Cloud Storage 5GB) เฉพาะภูมิภาค <strong>us-central1</strong> เท่านั้น หากเลือกเอเชีย (เช่น Singapore) จะถูกคิดค่าบริการ
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white">ขั้นตอนการสร้าง Firebase:</h3>
                <ol className="list-decimal list-inside space-y-2 pl-1 text-slate-300">
                  <li>
                    เข้าสู่{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 underline font-semibold"
                    >
                      Firebase Console
                    </a>{' '}
                    และกด <strong>Add Project</strong>
                  </li>
                  <li>
                    ไปที่เมนู <strong>Build ➔ Firestore Database</strong> กด Create database และเลือก Location เป็น <strong>us-central1 (nam5)</strong>
                  </li>
                  <li>
                    ไปที่เมนู <strong>Build ➔ Storage</strong> กด Get Started และเลือก Location เป็น <strong>us-central1</strong>
                  </li>
                  <li>
                    ไปที่ <strong>Project Settings (รูปเฟือง)</strong> ➔ เลื่อนลงมาที่หมวด Your apps ➔ กดไอคอนเว็บ <strong>(&lt;/&gt;)</strong> เพื่อสร้าง Web App
                  </li>
                  <li>คัดลอกค่า Config ทั้งหมดมาใส่ในไฟล์ <code>.env.local</code></li>
                </ol>
              </div>

              {/* Sample .env snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ตัวอย่างค่าใน .env.local:</span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."\nNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="fridge-app.firebaseapp.com"\nNEXT_PUBLIC_FIREBASE_PROJECT_ID="fridge-app"\nNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="fridge-app.appspot.com"\nNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"\nNEXT_PUBLIC_FIREBASE_APP_ID="1:123456:web:abcd"`,
                        'fb_env'
                      )
                    }
                    className="flex items-center gap-1 text-brand-400 hover:text-brand-300"
                  >
                    {copiedCode === 'fb_env' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedCode === 'fb_env' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
                <pre className="rounded-xl bg-slate-950 p-3 text-[11px] text-emerald-400 font-mono overflow-x-auto border border-white/5">
{`NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="fridge-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="fridge-app"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="fridge-app.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef"`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: VAPID KEYS */}
          {activeTab === 'vapid' && (
            <div className="space-y-4">
              <p>
                Web Push Notification ทำงานด้วยมาตรฐาน VAPID (Voluntary Application Server Identification) ซึ่งเป็นมาตรฐานสากลที่เบราว์เซอร์รับรอง <strong>ฟรี 100% ไม่ต้องผ่าน FCM</strong>
              </p>

              <div className="rounded-2xl bg-slate-900/70 p-4 border border-white/5 space-y-3">
                <h3 className="font-bold text-sm text-white">วิธีสร้างคีย์ VAPID ด้วยคำสั่งเดียว:</h3>
                <p>เปิด Terminal ในโฟลเดอร์โปรเจกต์แล้วรันคำสั่ง:</p>

                <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-brand-300 border border-white/5">
                  <code>npm run generate-vapid</code>
                  <button
                    onClick={() => copyToClipboard('npm run generate-vapid', 'cmd_vapid')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedCode === 'cmd_vapid' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400">
                  ระบบจะสร้าง <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> และ <code>VAPID_PRIVATE_KEY</code> ให้นำไปวางใน <code>.env.local</code> ได้ทันที
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL CRON */}
          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <p>
                Vercel Hobby Plan ให้สิทธิ์ใช้งาน <strong>Cron Jobs ฟรี 1 Job ต่อวัน</strong> ซึ่งเพียงพอสำหรับระบบแจ้งเตือนวันหมดอายุทุกเช้า
              </p>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-white">การทำงานของ Vercel Cron:</h3>
                <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-300">
                  <li>ไฟล์ <code>vercel.json</code> ถูกตั้งค่าให้เรียก <code>/api/cron/notify</code> อัตโนมัติทุกเช้า</li>
                  <li>ระบบจะค้นหารายการอาหารที่หมดอายุ <strong>วันนี้ (0 วัน)</strong>, <strong>ใน 3 วัน</strong> และ <strong>ใน 7 วัน</strong></li>
                  <li>ส่ง Web Push ไปยังทุกอุปกรณ์ที่กดเปิดรับการแจ้งเตือนไว้</li>
                </ul>

                <div className="rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 border border-white/5">
{`{
  "crons": [
    {
      "path": "/api/cron/notify",
      "schedule": "0 1 * * *"
    }
  ]
}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-3.5 flex justify-end bg-slate-950/40">
          <button
            onClick={onClose}
            className="rounded-xl bg-brand-500 px-5 py-2 text-xs font-semibold text-white shadow-glow-emerald hover:bg-brand-400 transition"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
