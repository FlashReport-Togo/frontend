// public/firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCmfRIO-c__CE7KkbXosWxqSgNugNLco20",
  authDomain: "flashreport-1f87e.firebaseapp.com",
  projectId: "flashreport-1f87e",
  storageBucket: "flashreport-1f87e.firebasestorage.app",
  messagingSenderId: "595191096327",
  appId: "1:595191096327:web:770740acd4751d328f76a2",
  measurementId: "G-6EF41788J5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Nouvelle notification";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo.png", // Optionnel
  };

  self.registration.showNotification(title, options);
});