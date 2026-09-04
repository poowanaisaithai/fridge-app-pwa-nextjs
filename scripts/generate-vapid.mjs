import webpush from 'web-push';

console.log('\n🔑 Generating VAPID Keys for Web Push Notifications...\n');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('--------------------------------------------------');
console.log('Copy these keys to your .env.local file:');
console.log('--------------------------------------------------');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:fridge-admin@example.com"`);
console.log('--------------------------------------------------\n');
