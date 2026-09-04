'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  Loader2,
  X,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  sendTestPushNotification,
} from '@/lib/push-notifications';
import { PushSubscriptionData } from '@/lib/types';

interface PushManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (isActive: boolean) => void;
}

export function PushManager({ isOpen, onClose, onStatusChange }: PushManagerProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<PushSubscriptionData | null>(null);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
      checkSubscription();
    }
  }, [isOpen]);

  const checkSubscription = async () => {
    const sub = await getCurrentPushSubscription();
    const active = Boolean(sub);
    setIsSubscribed(active);
    if (onStatusChange) onStatusChange(active);

    if (sub) {
      const raw = sub.toJSON();
      if (raw.endpoint && raw.keys) {
        setSubscriptionData({
          endpoint: raw.endpoint,
          keys: {
            p256dh: raw.keys.p256dh || '',
            auth: raw.keys.auth || '',
          },
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        });
      }
    }
  };

  if (!isOpen) return null;

  const handleToggleSubscribe = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (isSubscribed) {
        const ok = await unsubscribeFromPushNotifications();
        if (ok) {
          setIsSubscribed(false);
          setSubscriptionData(null);
          setStatusMessage({ text: 'ยกเลิกการรับแจ้งเตือนเรียบร้อยแล้ว', type: 'info' });
          if (onStatusChange) onStatusChange(false);
        }
      } else {
        const res = await subscribeToPushNotifications();
        if (res.success && res.subscription) {
          setIsSubscribed(true);
          setSubscriptionData(res.subscription);
          setPermissionState('granted');
          setStatusMessage({
            text: '🎉 เปิดใช้งานการแจ้งเตือนสำเร็จ! ระบบจะส่งแจ้งเตือน 7 วัน, 3 วัน และวันหมดอายุ',
            type: 'success',
          });
          if (onStatusChange) onStatusChange(true);
        } else {
          setStatusMessage({ text: res.error || 'เปิดการแจ้งเตือนไม่สำเร็จ', type: 'error' });
        }
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'เกิดข้อผิดพลาด', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    if (!subscriptionData) {
      setStatusMessage({ text: 'กรุณาเปิดการแจ้งเตือนก่อนส่งข้อความทดสอบ', type: 'error' });
      return;
    }

    setIsSendingTest(true);
    setStatusMessage(null);

    try {
      const res = await sendTestPushNotification(subscriptionData);
      if (res.success) {
        setStatusMessage({ text: res.message || 'ส่งแจ้งเตือนทดสอบสำเร็จ!', type: 'success' });
      } else {
        setStatusMessage({ text: res.error || 'ส่งแจ้งเตือนทดสอบล้มเหลว', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'ส่งทดสอบไม่สำเร็จ', type: 'error' });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-panel border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white sm:text-lg">
                ระบบแจ้งเตือน Web Push (VAPID)
              </h2>
              <p className="text-xs text-slate-400">ฟรี 100% แจ้งเตือนตรงสู่เบราว์เซอร์และมือถือ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`flex items-start gap-2.5 rounded-xl p-3 text-xs border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Bell className="h-4 w-4 flex-shrink-0 mt-0.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* 3-Milestone Alert Explanation */}
          <div className="rounded-2xl bg-slate-900/70 p-4 border border-white/5 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-400" />
              รอบการแจ้งเตือนอัตโนมัติ (Multi-Stage Alerts)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-rose-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-[10px] font-bold border border-rose-500/30">
                  1
                </span>
                <span>🚨 <strong>วันสุดท้าย (วันนี้):</strong> เตือนด่วนที่สุดว่าอาหารหมดอายุแล้ว</span>
              </div>
              <div className="flex items-center gap-2 text-amber-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold border border-amber-500/30">
                  2
                </span>
                <span>⏳ <strong>ล่วงหน้า 3 วัน:</strong> เตือนเร่งด่วนเพื่อให้เริ่มนำมาปรุงอาหาร</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/20 text-[10px] font-bold border border-yellow-500/30">
                  3
                </span>
                <span>📅 <strong>ล่วงหน้า 7 วัน:</strong> แจ้งเตือนล่วงหน้า 1 สัปดาห์สำหรับวางแผน</span>
              </div>
            </div>
          </div>

          {/* Current Status Indicator */}
          <div className="flex items-center justify-between rounded-xl bg-slate-900/50 p-3.5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <div
                className={`h-3 w-3 rounded-full ${
                  isSubscribed ? 'bg-brand-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'
                }`}
              />
              <div>
                <div className="text-xs font-semibold text-white">
                  {isSubscribed ? 'เปิดรับการแจ้งเตือนแล้ว' : 'ยังไม่ได้เปิดการแจ้งเตือน'}
                </div>
                <div className="text-[11px] text-slate-400">
                  สิทธิ์เบราว์เซอร์: {permissionState === 'granted' ? 'อนุญาตแล้ว' : permissionState === 'denied' ? 'ถูกบล็อก' : 'ยังไม่ระบุ'}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleSubscribe}
              disabled={isLoading}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                isSubscribed
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-glow-emerald hover:from-brand-500 hover:to-brand-400'
              }`}
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubscribed ? 'ปิดแจ้งเตือน' : 'เปิดรับการแจ้งเตือน'}</span>
            </button>
          </div>

          {/* Test Push Button */}
          {isSubscribed && (
            <div className="rounded-2xl bg-brand-950/30 p-4 border border-brand-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-300">
                  ทดสอบการส่ง Push เข้าเครื่องนี้
                </span>
                <button
                  onClick={handleSendTestPush}
                  disabled={isSendingTest}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-glow-emerald hover:bg-brand-400 disabled:opacity-50 transition"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{isSendingTest ? 'กำลังส่ง...' : 'ส่งแจ้งเตือนทดสอบ'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                กดปุ่มเพื่อทดสอบว่าเบราว์เซอร์/มือถือของคุณได้รับ Web Push จริงทันที
              </p>
            </div>
          )}

          {/* Technical Note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-white/5">
            <ShieldCheck className="h-4 w-4 text-brand-400 flex-shrink-0 mt-0.5" />
            <span>
              ระบบทำงานผ่าน Vercel Cron (`/api/cron/notify`) ตรวจสอบวันหมดอายุทุกเช้า และส่งผ่าน VAPID Web Push โดยตรง ไม่ผ่าน Firebase Cloud Messaging (FCM) จึงไม่มีค่าใช้จ่ายแอบแฝง
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
