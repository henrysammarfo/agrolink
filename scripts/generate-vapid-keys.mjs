#!/usr/bin/env node
/** Generate VAPID keys for web push. Add to .env:
 *  VITE_VAPID_PUBLIC_KEY=...
 *  VAPID_PRIVATE_KEY=...
 *  VAPID_SUBJECT=mailto:support@agrolink.app
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log("VITE_VAPID_PUBLIC_KEY=" + keys.publicKey);
console.log("VAPID_PRIVATE_KEY=" + keys.privateKey);
console.log("VAPID_SUBJECT=mailto:support@agrolink.app");
