'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Smartphone,
  Play,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
  Send,
  Loader2,
  Clock,
  Sparkles,
  Server,
  Database,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserProfile, PushSubscriptionData, FridgeItem } from '@/lib/types';
import { db, cleanForFirestore } from '@/lib/firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { sendTestPushNotification } from '@/lib/push-notifications';
import { getDaysRemaining } from '@/lib/date-utils';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: FridgeItem[];
}

type TabType = 'users' | 'devices' | 'cron' | 'system';

export function AdminDashboardModal({ isOpen, onClose, items }: AdminDashboardModalProps) {
  const { userProfile, isAdmin, fetchAllUsers, updateUserRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('users');

  // State for Users tab
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State for Devices tab
  const [devicesList, setDevicesList] = useState<{ id: string; sub: PushSubscriptionData }[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);

  // State for Cron tab
  const [isTriggeringCron, setIsTriggeringCron] = useState(false);
  const [cronResult, setCronResult] = useState<any>(null);

  // Feedback message
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, isAdmin, activeTab]);

  const loadData = async () => {
    if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'devices') {
      loadDevices();
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await fetchAllUsers();
      setUsersList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadDevices = async () => {
    if (!db) return;
    setIsLoadingDevices(true);
    try {
      const subsCol = collection(db, 'subscriptions');
      const snap = await getDocs(subsCol);
      const list = snap.docs.map((d) => ({
        id: d.id,
        sub: d.data() as PushSubscriptionData,
      }));
      setDevicesList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    const newRole = targetUser.role === 'admin' ? 'member' : 'admin';
    const confirmMsg = `ต้องการเปลี่ยนสิทธิ์ของ ${targetUser.displayName || targetUser.email} เป็น "${newRole.toUpperCase()}" หรือไม่?`;
    if (!confirm(confirmMsg)) return;

    const ok = await updateUserRole(targetUser.uid, newRole);
    if (ok) {
      setMessage({ text: `เปลี่ยนสิทธิ์เป็น ${newRole} สำเร็จแล้ว`, type: 'success' });
      loadUsers();
    } else {
      setMessage({ text: 'ไม่สามารถเปลี่ยนสิทธิ์ได้', type: 'error' });
    }
  };

  const handleDeleteDevice = async (subId: string) => {
    if (!db) return;
    if (!confirm('ต้องการลบอุปกรณ์นี้ออกจากระบบแจ้งเตือนหรือไม่?')) return;

    try {
      await deleteDoc(doc(db, 'subscriptions', subId));
      setMessage({ text: 'ลบอุปกรณ์สำเร็จแล้ว', type: 'success' });
      loadDevices();
    } catch (e) {
      setMessage({ text: 'ลบอุปกรณ์ไม่สำเร็จ', type: 'error' });
    }
  };

  const handleTestDevice = async (sub: PushSubscriptionData, subId: string) => {
    setTestingDeviceId(subId);
    try {
      const res = await sendTestPushNotification(sub);
      if (res.success) {
        setMessage({ text: 'ยิงแจ้งเตือนทดสอบไปยังอุปกรณ์สำเร็จ!', type: 'success' });
      } else {
        setMessage({ text: res.error || 'ส่งแจ้งเตือนไม่สำเร็จ', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'ส่งทดสอบไม่สำเร็จ', type: 'error' });
    } finally {
      setTestingDeviceId(null);
    }
  };

  const handleTriggerCron = async () => {
    setIsTriggeringCron(true);
    setCronResult(null);
    setMessage(null);

    try {
      const res = await fetch('/api/cron/notify');
      const data = await res.json();
      setCronResult(data);
      if (res.ok && data.success) {
        setMessage({ text: data.message || 'รัน Cron สำเร็จ!', type: 'success' });
      } else {
        setMessage({ text: data.message || data.error || 'การรัน Cron มีข้อผิดพลาด', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err?.message || 'ไม่สามารถเรียก Cron API ได้', type: 'error' });
    } finally {
      setIsTriggeringCron(false);
    }
  };

  if (!isOpen) return null;

  // Compute breakdown for Cron tab
  const unconsumed = items.filter((i) => !i.consumed);
  const todayCount = unconsumed.filter((i) => getDaysRemaining(i.expirationDate) === 0).length;
  const urgent3dCount = unconsumed.filter((i) => {
    const d = getDaysRemaining(i.expirationDate);
    return d > 0 && d <= 3;
  }).length;
  const warning7dCount = unconsumed.filter((i) => {
    const d = getDaysRemaining(i.expirationDate);
    return d > 3 && d <= 7;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl glass-panel border border-brand-500/30 shadow-2xl bg-slate-900/95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white sm:text-lg">
                  ระบบจัดการหลังบ้าน (Admin Console)
                </h2>
                <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                  Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                จัดการสิทธิ์สมาชิก อุปกรณ์รับแจ้งเตือน และควบคุมระบบ Vercel Cron
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/40 px-5">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-medium transition ${
              activeTab === 'users'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            สมาชิก ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-medium transition ${
              activeTab === 'devices'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            อุปกรณ์รับแจ้งเตือน ({devicesList.length})
          </button>
          <button
            onClick={() => setActiveTab('cron')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-medium transition ${
              activeTab === 'cron'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-4 w-4" />
            ศูนย์ควบคุม Cron
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 text-xs sm:text-sm font-medium transition ${
              activeTab === 'system'
                ? 'border-brand-400 text-brand-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="h-4 w-4" />
            สถานะระบบ
          </button>
        </div>

        {/* Global Alert Notification */}
        {message && (
          <div
            className={`mx-5 mt-4 flex items-center justify-between rounded-xl p-3 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  สมาชิกทุกคนในตู้เย็นครอบครัว (แชร์ข้อมูลอาหารร่วมกัน)
                </p>
                <button
                  onClick={loadUsers}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </button>
              </div>

              {isLoadingUsers ? (
                <div className="flex justify-center py-10 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : usersList.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-8 text-center text-slate-400 text-xs">
                  ยังไม่มีข้อมูลสมาชิก
                </div>
              ) : (
                <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-slate-950/40 overflow-hidden">
                  {usersList.map((u) => (
                    <div
                      key={u.uid}
                      className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition"
                    >
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt=""
                            className="h-10 w-10 rounded-full border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white font-bold">
                            {(u.displayName || u.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {u.displayName || 'ไม่มีชื่อ'}
                            </span>
                            {u.role === 'admin' ? (
                              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300 border border-violet-500/30">
                                ผู้ดูแล (Admin)
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-600/30">
                                สมาชิก (Member)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>

                      {/* Role switcher button */}
                      {userProfile?.uid !== u.uid && (
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        >
                          เปลี่ยนเป็น {u.role === 'admin' ? 'Member' : 'Admin'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PUSH DEVICES */}
          {activeTab === 'devices' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  อุปกรณ์ (เบราว์เซอร์/มือถือ) ที่ลงทะเบียนรับ Web Push Alert
                </p>
                <button
                  onClick={loadDevices}
                  className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDevices ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </button>
              </div>

              {isLoadingDevices ? (
                <div className="flex justify-center py-10 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : devicesList.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-8 text-center text-slate-400 text-xs">
                  ยังไม่มีอุปกรณ์ลงทะเบียนรับการแจ้งเตือน
                </div>
              ) : (
                <div className="space-y-2.5">
                  {devicesList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Smartphone className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-medium text-white truncate max-w-[200px] sm:max-w-xs">
                              ID: {item.id.slice(0, 16)}...
                            </span>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.2 text-[9px] text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            ลงทะเบียนเมื่อ: {new Date(item.sub.createdAt || Date.now()).toLocaleDateString('th-TH')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleTestDevice(item.sub, item.id)}
                          disabled={testingDeviceId === item.id}
                          className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 transition border border-amber-500/30"
                          title="ส่ง Push ทดสอบไปที่เครื่องนี้"
                        >
                          {testingDeviceId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">ทดสอบ</span>
                        </button>

                        <button
                          onClick={() => handleDeleteDevice(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition"
                          title="ลบอุปกรณ์"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CRON CONTROL */}
          {activeTab === 'cron' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-center">
                  <span className="text-xl">🚨</span>
                  <div className="mt-1 text-lg font-bold text-rose-300">{todayCount}</div>
                  <div className="text-[10px] text-rose-400">หมดอายุวันนี้</div>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-center">
                  <span className="text-xl">⏳</span>
                  <div className="mt-1 text-lg font-bold text-amber-300">{urgent3dCount}</div>
                  <div className="text-[10px] text-amber-400">หมดอายุใน 3 วัน</div>
                </div>
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3.5 text-center">
                  <span className="text-xl">📅</span>
                  <div className="mt-1 text-lg font-bold text-yellow-300">{warning7dCount}</div>
                  <div className="text-[10px] text-yellow-400">หมดอายุใน 7 วัน</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">ทดสอบสั่งรัน Cron Job ทันที</h3>
                    <p className="text-xs text-slate-400">
                      ยิงคำสั่งแจ้งเตือนไปยัง API <code>/api/cron/notify</code> เพื่อส่ง Push ทุกเครื่อง
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerCron}
                    disabled={isTriggeringCron}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-500 to-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-glow-emerald hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                  >
                    {isTriggeringCron ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    ) : (
                      <Play className="h-4 w-4 fill-slate-950 text-slate-950" />
                    )}
                    รัน Cron ตอนนี้
                  </button>
                </div>

                {cronResult && (
                  <div className="mt-3 rounded-xl bg-slate-900 p-3 border border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>ผลลัพธ์จากเซิร์ฟเวอร์ (API Output):</span>
                      <span className="text-emerald-400 font-mono">200 OK</span>
                    </div>
                    <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded-lg">
                      {JSON.stringify(cronResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM INFO */}
          {activeTab === 'system' && (
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-brand-400" />
                  สถาปัตยกรรม 100% Free Tier (ไร้ต้นทุน)
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Hosting & Cron:</span>
                    <span className="font-mono text-emerald-400">Vercel (Hobby Free)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Database:</span>
                    <span className="font-mono text-emerald-400">Firebase Firestore (us-central1 Free Tier)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Image Storage:</span>
                    <span className="font-mono text-emerald-400">Zero-Card Inline WebP (&lt;45KB)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Web Push Protocol:</span>
                    <span className="font-mono text-emerald-400">Native VAPID Web Push API</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Authentication:</span>
                    <span className="font-mono text-emerald-400">Google Sign-In (Firebase Auth Free)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <h4 className="font-bold text-white mb-1.5">คำแนะนำเรื่อง Security Rules</h4>
                <p className="text-slate-400 leading-relaxed">
                  เนื่องจากระบบมี Authentication แล้ว คุณสามารถเข้าไปเปลี่ยน Firestore Rules ใน Firebase Console ให้เป็น <code>request.auth != null</code> เพื่อล็อคความปลอดภัยให้เฉพาะสมาชิกในครอบครัวที่ล็อกอินแล้วเท่านั้นที่เข้าถึงตู้เย็นได้ครับ
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
