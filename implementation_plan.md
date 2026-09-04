# แผนการดำเนินงานและสถานะโปรเจกต์ FreshFridge (PWA) ❄️🥗

## 1. สถานะปัจจุบันของโปรเจกต์ (Project Current Status)
โครงสร้างและฟีเจอร์หลักทั้งหมดของโปรเจกต์ได้รับการพัฒนาเรียบร้อยแล้ว:
- [x] **Next.js 14+ App Router & Tailwind CSS** พร้อมดีไซน์ Dark/Modern Glassmorphism
- [x] **PWA Ready**: `manifest.json`, Service Worker (`sw.js`), และปุ่ม "Add to Home Screen"
- [x] **Dashboard**: แสดงสถานะตู้เย็น สรุปจำนวนของใกล้หมดอายุ และเรียงลำดับวันหมดอายุอัตโนมัติ
- [x] **Vision OCR (Zero-cost Tesseract.js)**: สแกนบรรจุภัณฑ์ ดึงชื่อและตรวจจับวันหมดอายุ (`EXP`, `BB`, `BBD`, `ควรบริโภคก่อน` ฯลฯ)
- [x] **Client-Side Image Compression**: ย่อขนาดภาพก่อนอัปโหลดเพื่อประหยัดพื้นที่ Free Tier 5GB
- [x] **Web Push API (VAPID)**: สร้างคีย์ VAPID เรียบร้อยแล้ว พร้อม Service Worker จัดการ Push Alert
- [x] **ระบบแจ้งเตือน 3 จังหวะ**: 7 วันล่วงหน้า, 3 วันล่วงหน้า, และวันสุดท้าย (วันนี้)
- [x] **Vercel Cron API (`/api/cron/notify`)**: สำหรับยิง Cron เช้าทุกวันผ่าน `vercel.json`
- [x] **Dual-Mode (Firebase & LocalStorage Fallback)**: รองรับการทำงานแบบ Offline/LocalStorage ทันทีเมื่อยังไม่ได้ใส่คีย์ Firebase
- [x] **แก้ไข TypeScript Build Issue**: แก้ไข Type ของ `applicationServerKey` ใน [push-notifications.ts](file:///d:/PALM/dev/fridge-app/lib/push-notifications.ts) เพื่อให้คอมไพล์ผ่านฉลุย

---

## 2. ขั้นตอนต่อไปที่ต้องทำ (Next Steps)

### ขั้นตอนที่ 1: ทดสอบการรันในเครื่อง (Local Testing)
1. รัน Development Server (หรือจะทดสอบ build):
   ```bash
   npm run dev
   ```
2. เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`
3. ทดลองใช้งาน:
   - ตรวจสอบรายการอาหารตัวอย่าง
   - ทดสอบกดปุ่ม **"+ เพิ่มอาหารเข้าตู้เย็น"**
   - ลองใช้ปุ่ม **"สแกนด้วย Vision OCR"** ด้วยการอัปโหลดหรือถ่ายรูปฉลาก/บรรจุภัณฑ์อาหาร
   - ทดสอบกดปุ่ม **"รับการแจ้งเตือน" (Web Push)**

*(หมายเหตุ: ปัจจุบันระบบมี Mock Mode แบบ LocalStorage ทำงานได้ทันทีแม้ยังไม่ใส่ Firebase config)*

---

### ขั้นตอนที่ 2: ตั้งค่า Firebase (100% Free Tier: `us-central1`)
เมื่อต้องการให้ข้อมูลบันทึกลง Cloud Database และ Sync หลายเครื่อง:
1. เข้า [Firebase Console](https://console.firebase.google.com)
2. สร้างโปรเจกต์ใหม่ (ไม่ต้องเปิด Google Analytics ก็ได้)
3. **Firestore Database**:
   - เลือกสร้าง Database
   - ⚠️ **กฎสำคัญ:** ต้องเลือก Location เป็น **`us-central1` (nam5)** เพื่อความปลอดภัยและอยู่ใน Free Tier
4. **Cloud Storage**:
   - สร้าง Storage Bucket
   - ⚠️ **กฎสำคัญ:** ต้องเลือก Location เป็น **`us-central1`**
5. ไปที่ **Project Settings** ➔ แท็บ **General** ➔ เพิ่ม Web App (`</>`)
6. คัดลอกค่า Config มาใส่ใน `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="<project-id>.firebaseapp.com"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="<project-id>"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="<project-id>.appspot.com"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="1:...:web:..."
   ```

---

### ขั้นตอนที่ 3: Deploy ขึ้น Vercel และเปิดใช้ Cron Job
1. Push โปรเจกต์ขึ้น GitHub
2. เข้าไปที่ [Vercel](https://vercel.com) แล้วกด **Add New Project** ➔ เลือก Repository นี้
3. ใส่ Environment Variables ใน Vercel ให้ตรงกับ `.env.local` (Firebase, VAPID, และ `CRON_SECRET`)
4. กด **Deploy**
5. ตรวจสอบในแท็บ **Settings ➔ Cron Jobs** ของ Vercel จะพบ `/api/cron/notify` ถูกตั้งเวลาให้ทำงานทุกวันเวลา 08:00 น. อัตโนมัติ
