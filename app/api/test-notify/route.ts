import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { PushSubscriptionData } from '@/lib/types';

// Configure Web Push VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublicKey && vapidPrivateKey && !vapidPublicKey.includes('YOUR_PUBLIC')) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (e) {
    console.warn('VAPID setup notice:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subscription: PushSubscriptionData = body.subscription;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'ข้อมูล Subscription ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey || vapidPublicKey.includes('YOUR_PUBLIC')) {
      return NextResponse.json(
        {
          error:
            'ยังไม่ได้ตั้งค่า VAPID Keys ใน .env.local กรุณารันคำสั่ง "npm run generate-vapid" แล้วใส่คีย์ใน .env.local ก่อน',
        },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: '🎉 ทดสอบการแจ้งเตือน FreshFridge สำเร็จ!',
      body: 'ระบบ Web Push Notifications พร้อมทำงานแล้ว คุณจะได้รับการแจ้งเตือน 7 วัน, 3 วัน และวันหมดอายุอัตโนมัติ ❄️',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
      data: { url: '/' },
      tag: `test-push-${Date.now()}`,
    });

    const pushSub = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    };

    await webpush.sendNotification(pushSub, payload);

    return NextResponse.json({
      success: true,
      message: 'ส่งการแจ้งเตือนทดสอบไปยังอุปกรณ์ของคุณเรียบร้อยแล้ว!',
    });
  } catch (error: any) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { error: error?.message || 'ส่งแจ้งเตือนทดสอบไม่สำเร็จ กรุณาตรวจสอบ VAPID keys' },
      { status: 500 }
    );
  }
}
