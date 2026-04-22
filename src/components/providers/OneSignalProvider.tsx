"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;

    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      serviceWorkerParam: { scope: "/push/onesignal/" },
      serviceWorkerPath: "/push/onesignal/OneSignalSDKWorker.js",
      allowLocalhostAsSecureOrigin: true,
    }).then(() => {
      // Listen for subscription changes using the v2 SDK API
      OneSignal.User.PushSubscription.addEventListener(
        "change",
        async (event) => {
          const { current } = event;
          if (!current.optedIn || !current.id) return;
          await fetch("/api/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ player_id: current.id }),
          }).catch(console.error);
        }
      );
    }).catch(console.error);
  }, []);

  return null;
}
