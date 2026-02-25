"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "production")
      return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (reg.installing) return;
        reg.update();
      })
      .catch(() => {});
  }, []);
  return null;
}
