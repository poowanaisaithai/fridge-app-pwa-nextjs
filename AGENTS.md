# Project: Refrigerator Expiry Notification PWA
# Role: Expert Full-Stack Next.js Developer & Cost-Optimization Architect

## 1. Project Overview
Build a Progressive Web App (PWA) for managing and notifying users about expiring items in their refrigerator. The project MUST strictly follow a "100% Free Tier" Hybrid Architecture using Vercel (for Hosting/API) and Firebase (for Database/Storage).

## 2. Tech Stack & Hybrid Architecture
- **Frontend & Backend (API Routes):** Next.js 14+ (App Router), React, Tailwind CSS.
- **Hosting & Deployment:** Vercel (Hobby Plan).
- **Database:** Firebase Firestore Web SDK.
- **Image Storage:** Firebase Cloud Storage Web SDK.
- **Push Notifications:** Web Push API (VAPID) using the `web-push` Node.js package + native Service Worker. (DO NOT use Firebase Cloud Messaging / FCM).
- **Task Scheduling:** Vercel Cron Jobs.

## 3. Strict Cost-Optimization Rules (Free Tier ONLY)
- **Firebase Region:** The AI must explicitly instruct the user to create the Firebase project and initialize Firestore/Storage exclusively in the **`us-central1` (nam5)** region to avoid billing charges. Do NOT use Asian regions like Singapore.
- **No Paid APIs:** Do not implement paid OCR or Vision APIs for reading images.
- **Free Vision OCR Capability:** Implement 100% Free Client-Side Vision OCR (using `tesseract.js` WebAssembly or optional Free Tier AI) to automatically scan packaging, extract product names, and parse expiration dates (EXP, BB, BBD, etc.) directly in the browser with zero server/API costs.
- **Image Optimization:** Implement client-side image compression before uploading to Firebase Storage to minimize the 5GB free tier usage.

## 4. Core Features
1. **PWA Setup:** Generate `manifest.json` and a Service Worker to allow users to "Add to Home Screen".
2. **Dashboard:** Display a list of fridge items sorted by expiration date (closest first).
3. **Add Item Form with Vision OCR:** Fields for Item Name, Category, Expiration Date, and an Image Upload button (uploads directly to Firebase Storage). Includes a **"Scan with Vision OCR"** button that auto-detects name and expiration date.
4. **Notification System (7 Days, 3 Days, and Final Day Alerts):**
   - A button in the UI to "Request Notification Permission" and save the subscription object to Firestore.
   - An API endpoint (`/api/cron/notify`) to be triggered by Vercel Cron. This endpoint checks Firestore for items expiring at key milestones: **7 days before, 3 days before, and on the final day (today)**, and sends customized Web Push Notifications via VAPID with urgency-specific messages.

## 5. Documentation & Implementation Plan (Thai Language Rule)
- **Implementation Plan Language:** Always maintain and update `implementation_plan.md` in Thai language whenever changes or updates are made.
- **Output Configuration:**
  - Provide the exact configuration for `vercel.json` (for Cron setup).
  - Provide clean, modular code with comments. Include a `.env.example` file showing required VAPID and Firebase variables.
  - Write clear instructions in Thai on how to set up the Firebase Web SDK (us-central1) and generate VAPID keys.