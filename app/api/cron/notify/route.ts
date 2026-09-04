import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FridgeItem, PushSubscriptionData } from '@/lib/types';
import { getDaysRemaining } from '@/lib/date-utils';

// Initialize Firebase server instance
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'AIzaSyYourFirebaseApiKeyHere'
);

const app = isConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
const db = app ? getFirestore(app) : null;

// Configure Web Push VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey && !vapidPublicKey.includes('YOUR_PUBLIC')) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function GET(req: NextRequest) {
  return handleCronNotification(req);
}

export async function POST(req: NextRequest) {
  return handleCronNotification(req);
}

async function handleCronNotification(req: NextRequest) {
  try {
    // 1. Check Cron Secret Authorization (if configured in env)
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // If Vercel Cron header is present, Vercel sets 'x-vercel-cron': '1'
      const isVercelCron = req.headers.get('x-vercel-cron') === '1';
      if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    if (!isConfigured || !db) {
      return NextResponse.json({
        success: false,
        message: 'Firebase is not yet configured. Please set your Firebase credentials in environment variables.',
      });
    }

    if (!vapidPublicKey || !vapidPrivateKey || vapidPublicKey.includes('YOUR_PUBLIC')) {
      return NextResponse.json({
        success: false,
        message: 'VAPID keys are not configured. Run npm run generate-vapid to generate keys.',
      });
    }

    // 2. Fetch all unconsumed fridge items from Firestore
    const itemsCol = collection(db, 'items');
    const itemsSnapshot = await getDocs(itemsCol);
    const items: FridgeItem[] = [];
    itemsSnapshot.forEach((docSnap) => {
      const data = docSnap.data() as FridgeItem;
      if (!data.consumed) {
        items.push({ ...data, id: docSnap.id });
      }
    });

    // 3. Classify items into 3 milestone notification tiers:
    // Tier 1: วันสุดท้าย / วันนี้ (0 days)
    // Tier 2: เร่งด่วน 3 วัน (1..3 days)
    // Tier 3: เตือนล่วงหน้า 7 วัน (4..7 days)
    const todayItems: FridgeItem[] = [];
    const urgent3dItems: FridgeItem[] = [];
    const warning7dItems: FridgeItem[] = [];

    items.forEach((item) => {
      const days = getDaysRemaining(item.expirationDate);
      if (days === 0) {
        todayItems.push(item);
      } else if (days > 0 && days <= 3) {
        urgent3dItems.push(item);
      } else if (days > 3 && days <= 7) {
        warning7dItems.push(item);
      }
    });

    const totalExpiringCount = todayItems.length + urgent3dItems.length + warning7dItems.length;

    if (totalExpiringCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'ไม่มีรายการอาหารที่เข้าเกณฑ์แจ้งเตือน (7 วัน, 3 วัน หรือวันนี้)',
        stats: { today: 0, urgent3d: 0, warning7d: 0, total: 0 },
      });
    }

    // 4. Build Notification Content with Urgency-Specific Emojis & Titles
    let title = 'FreshFridge แจ้งเตือนอาหารในตู้เย็น';
    const bodyLines: string[] = [];

    if (todayItems.length > 0) {
      title = '🚨 ด่วนที่สุด! มีอาหารหมดอายุวันนี้';
      const names = todayItems.map((i) => i.name).slice(0, 2).join(', ');
      const more = todayItems.length > 2 ? ` และอีก ${todayItems.length - 2} รายการ` : '';
      bodyLines.push(`🔴 หมดอายุวันนี้: ${names}${more} (รีบทานเลย!)`);
    }

    if (urgent3dItems.length > 0) {
      if (todayItems.length === 0) {
        title = '⏳ แจ้งเตือน: มีอาหารจะหมดอายุใน 3 วัน';
      }
      const names = urgent3dItems.map((i) => i.name).slice(0, 2).join(', ');
      const more = urgent3dItems.length > 2 ? ` และอีก ${urgent3dItems.length - 2} รายการ` : '';
      bodyLines.push(`🟠 หมดอายุใน 3 วัน: ${names}${more}`);
    }

    if (warning7dItems.length > 0) {
      if (todayItems.length === 0 && urgent3dItems.length === 0) {
        title = '📅 แจ้งเตือนล่วงหน้า 7 วัน';
      }
      const names = warning7dItems.map((i) => i.name).slice(0, 2).join(', ');
      const more = warning7dItems.length > 2 ? ` และอีก ${warning7dItems.length - 2} รายการ` : '';
      bodyLines.push(`🟡 หมดอายุใน 7 วัน: ${names}${more}`);
    }

    const payload = JSON.stringify({
      title,
      body: bodyLines.join('\n'),
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      data: { url: '/' },
      tag: `expiry-alert-${Date.now()}`,
    });

    // 5. Fetch all Push Subscriptions from Firestore
    const subsCol = collection(db, 'subscriptions');
    const subsSnapshot = await getDocs(subsCol);
    const subscriptions: { id: string; sub: PushSubscriptionData }[] = [];
    subsSnapshot.forEach((docSnap) => {
      subscriptions.push({ id: docSnap.id, sub: docSnap.data() as PushSubscriptionData });
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'ตรวจพบอาหารใกล้หมดอายุ แต่ยังไม่มีผู้ใช้อุปกรณ์ใดลงทะเบียนรับการแจ้งเตือน',
        stats: {
          todayCount: todayItems.length,
          urgent3dCount: urgent3dItems.length,
          warning7dCount: warning7dItems.length,
          subscriptionsCount: 0,
        },
      });
    }

    // 6. Send Web Push to all devices & Clean up dead subscriptions
    let sentCount = 0;
    let failedCount = 0;
    const cleanupPromises: Promise<void>[] = [];

    for (const record of subscriptions) {
      const pushSub = {
        endpoint: record.sub.endpoint,
        keys: record.sub.keys,
      };

      try {
        await webpush.sendNotification(pushSub, payload);
        sentCount++;
      } catch (err: any) {
        failedCount++;
        // If status is 410 (Gone) or 404 (Not Found), remove invalid subscription
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          cleanupPromises.push(deleteDoc(doc(db, 'subscriptions', record.id)));
        }
      }
    }

    await Promise.all(cleanupPromises);

    return NextResponse.json({
      success: true,
      message: `ส่งการแจ้งเตือนสำเร็จ ${sentCount} เครื่อง (ล้มเหลว/หมดอายุ ${failedCount} เครื่อง)`,
      notification: { title, body: bodyLines.join(' | ') },
      stats: {
        todayCount: todayItems.length,
        urgent3dCount: urgent3dItems.length,
        warning7dCount: warning7dItems.length,
        totalExpiring: totalExpiringCount,
        sentDevices: sentCount,
        cleanedDevices: cleanupPromises.length,
      },
    });
  } catch (error: any) {
    console.error('Cron notify error:', error);
    return NextResponse.json(
      { error: error?.message || 'เกิดข้อผิดพลาดในการรัน Cron Notification' },
      { status: 500 }
    );
  }
}
