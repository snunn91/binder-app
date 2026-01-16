import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) throw new Error("Missing FIREBASE_PRIVATE_KEY");
  return key.replace(/\\n/g, "\n");
}

const isNewApp = getApps().length === 0;
const app = isNewApp
  ? initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    })
  : getApps()[0];

export const adminDb = getFirestore(app);
if (isNewApp) {
  adminDb.settings({ ignoreUndefinedProperties: true });
}
