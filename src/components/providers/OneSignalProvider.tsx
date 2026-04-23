"use client";

import { useEffect, useRef } from "react";
import OneSignal from "react-onesignal";

export default function OneSignalProvider() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      serviceWorkerParam: { scope: "/" },
      serviceWorkerPath: "/OneSignalSDKWorker.js",
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
    }).catch((error) => {
      initializedRef.current = false;
      console.error(error);
    });
  }, []);

  return null;
}
