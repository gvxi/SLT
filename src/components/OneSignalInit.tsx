'use client';

import { useEffect } from "react";

export default function OneSignalInit() {
  useEffect(() => {
    import("react-onesignal").then(({ default: OneSignal }) => {
      void OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        notifyButton: { enable: true } as Parameters<typeof OneSignal.init>[0]["notifyButton"],
        allowLocalhostAsSecureOrigin: true,
      });
    });
  }, []);

  return null;
}