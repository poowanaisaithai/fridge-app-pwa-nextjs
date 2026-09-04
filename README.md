# FreshFridge - Refrigerator Expiry Notification PWA ❄️🥗

Progressive Web App (PWA) สำหรับติดตามและแจ้งเตือนวันหมดอายุของอาหารในตู้เย็นแบบ **100% Free Tier Hybrid Architecture** (Vercel + Firebase `us-central1` + Web Push VAPID + Free Vision OCR)

---

## 🌟 ฟีเจอร์หลัก (Core Features)

1. **ระบบแจ้งเตือน 3 จังหวะ (Multi-Stage Expiry Alerts):**
   - 🚨 **วันสุดท้าย (วันนี้ - 0 วัน):** แจ้งเตือนระดับวิกฤตว่าถึงวันหมดอายุแล้ว ให้รีบทานทันที
   - ⏳ **ล่วงหน้า 3 วัน (1-3 วัน):** แจ้งเตือนเร่งด่วนเพื่อให้เริ่มนำมาปรุงอาหาร
   - 📅 **ล่วงหน้า 7 วัน (4-7 วัน):** แจ้งเตือนล่วงหน้า 1 สัปดาห์สำหรับวางแผน
2. **ระบบสแกน Vision OCR ฟรี 100% (Zero Cost):**
   - ทำงานผ่าน **Tesseract.js** (WebAssembly) บนเครื่องของผู้ใช้โดยตรง ไม่เสียค่า API รายเดือน
   - ดึงชื่อสินค้า และตรวจจับข้อความวันหมดอายุ (`EXP`, `BB`, `BBD`, `BEST BEFORE`, `USE BY`, `หมดอายุ`, `ควรบริโภคก่อน`) แปลงลงฟอร์มอัตโนมัติ
3. **ระบบบีบอัดรูปภาพฝั่ง Client (Canvas Compression):**
   - บีบอัดภาพถ่ายความละเอียดสูงจากกล้องมือถือ (3-12 MB) ให้เหลือต่ำกว่า **100 KB** ก่อนอัปโหลด ช่วยให้ใช้งานพื้นที่ 5GB Free Tier ใน Firebase Storage ได้ยาวนานหลายหมื่นรูป
4. **Web Push API (VAPID) + Native Service Worker:**
   - ส่งแจ้งเตือนตรงผ่าน Browser Push Service (Chrome, Safari iOS 16.4+, Edge, Android) ฟรี 100% ไม่ต้องผ่าน FCM Gateway
5. **Vercel Cron Jobs:**
   - ตรวจสอบรายการอาหารที่หมดอายุและยิง Web Push อัตโนมัติทุกเช้าผ่าน `/api/cron/notify`
6. **PWA Mobile-First & Offline Ready:**
   - มีปุ่ม "Add to Home Screen" ติดตั้งใช้งานเสมือน App แท้บนมือถือ

---

## 🚀 สถาปัตยกรรม 100% Free Tier (กฎเหล็ก)

| ส่วนประกอบ | บริการที่ใช้ | แผนบริการ (Free Tier) | หมายเหตุสำคัญ |
|---|---|---|---|
| **Frontend & API** | Next.js 14+ (App Router) | Vercel Hobby Plan (ฟรี) | รองรับ Serverless API & Cron 1 ครั้ง/วัน |
| **Database** | Firebase Firestore | Spark Plan (ฟรี) | **ต้องเลือก Region: `us-central1` (nam5)** |
| **Storage** | Firebase Cloud Storage | Spark Plan (5GB ฟรี) | **ต้องเลือก Region: `us-central1`** |
| **Push Service** | Web Push API (VAPID) | มาตรฐาน W3C (ฟรี 100%) | ใช้แพ็กเกจ `web-push` ส่งตรง ไม่เสียเงิน |
| **Vision OCR** | Tesseract.js (Client-side) | WebAssembly ในเบราว์เซอร์ | รันบนเครื่องผู้ใช้ ไม่มีค่า API และ Server |

---

## 🛠️ ขั้นตอนการติดตั้งและรันโปรเจกต์ (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. สร้างคีย์ VAPID สำหรับ Web Push (คำสั่งเดียว)
```bash
npm run generate-vapid
```
คัดลอกค่า `NEXT_PUBLIC_VAPID_PUBLIC_KEY` และ `VAPID_PRIVATE_KEY` ไปใส่ในไฟล์ `.env.local`

### 3. ตั้งค่า Firebase (Region: `us-central1`)
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com) และสร้างโปรเจกต์ใหม่
2. สร้าง **Firestore Database** และเลือก Location เป็น **`us-central1` (nam5)**
3. สร้าง **Cloud Storage** และเลือก Location เป็น **`us-central1`**
4. ไปที่ **Project Settings** ➔ เพิ่ม Web App (`</>`) ➔ คัดลอกค่า Config มาใส่ใน `.env.local`

ตัวอย่างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-app"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456:web:abcdef"

NEXT_PUBLIC_VAPID_PUBLIC_KEY="BEl62..."
VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY..."
VAPID_SUBJECT="mailto:your-email@example.com"

CRON_SECRET="your_secret_string"
```

### 4. รันระบบในเครื่อง (Local Development)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

---

## 📦 การ Deploy ขึ้น Vercel และตั้งค่า Cron Job

1. Push โค้ดขึ้น GitHub
2. Import repository เข้าสู่ [Vercel](https://vercel.com)
3. เพิ่ม Environment Variables ในหน้า Vercel Project Settings ให้ครบตาม `.env.local`
4. ไฟล์ `vercel.json` จะลงทะเบียน Cron Job ให้ Vercel เรียก `/api/cron/notify` อัตโนมัติทุกเช้า
