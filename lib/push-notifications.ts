import { PushSubscriptionData } from './types';
import { savePushSubscriptionToDb } from './firebase';

/**
 * Convert VAPID base64 public key string to Uint8Array for PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register Service Worker for PWA and Web Push
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return reg;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Get current push subscription state
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.error('Failed to get push subscription:', err);
    return null;
  }
}

/**
 * Subscribe user device to Web Push notifications using VAPID
 */
export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  subscription?: PushSubscriptionData;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('PushManager' in window) || !('serviceWorker' in navigator)) {
    return { success: false, error: 'เบราว์เซอร์นี้ไม่รองรับ Web Push Notifications' };
  }

  try {
    // 1. Request browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'คุณปฏิเสธการอนุญาตแจ้งเตือน (Permission Denied)' };
    }

    // 2. Get Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Get Public VAPID Key from env
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey || vapidPublicKey.includes('YOUR_PUBLIC_VAPID_KEY')) {
      return {
        success: false,
        error: 'ยังไม่ได้ตั้งค่า NEXT_PUBLIC_VAPID_PUBLIC_KEY ใน .env.local (รัน npm run generate-vapid เพื่อสร้าง)',
      };
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    // 4. Subscribe via PushManager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    const rawSub = subscription.toJSON();
    if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
      return { success: false, error: 'ข้อมูล Push Subscription ไม่สมบูรณ์' };
    }

    const subData: PushSubscriptionData = {
      endpoint: rawSub.endpoint,
      keys: {
        p256dh: rawSub.keys.p256dh,
        auth: rawSub.keys.auth,
      },
      userAgent: navigator.userAgent,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    // 5. Save to Firestore
    await savePushSubscriptionToDb(subData);

    return { success: true, subscription: subData };
  } catch (error: any) {
    console.error('Push subscription failed:', error);
    return { success: false, error: error?.message || 'เกิดข้อผิดพลาดในการลงทะเบียนรับการแจ้งเตือน' };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to unsubscribe:', err);
    return false;
  }
}

/**
 * Send immediate test push notification
 */
export async function sendTestPushNotification(subscription: PushSubscriptionData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/test-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'ส่งแจ้งเตือนทดสอบไม่สำเร็จ' };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' };
  }
}
