import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as isAnalyticsSupported, Analytics } from "firebase/analytics";
import { getMessaging, getToken, isSupported as isMessagingSupported, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Évite les erreurs de réinitialisation lors du Hot Reload en dev Next.js
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialisation sécurisée d'Analytics (uniquement côté navigateur)
export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== "undefined" && (await isAnalyticsSupported())) {
    return getAnalytics(app);
  }
  return null;
};

// Récupération sécurisée du Token FCM pour le Push
export const getFcmToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  try {
    const hasMessagingSupport = await isMessagingSupported();
    if (!hasMessagingSupport) return null;

    const messaging = getMessaging(app);

    // Enregistrement du Service Worker
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return currentToken || null;
  } catch (error) {
    console.error("Erreur FCM Token :", error);
    return null;
  }
};

export { app };