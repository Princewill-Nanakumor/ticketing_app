"use client";

import { useCallback, useEffect, useState } from "react";
import Toast from "@/components/toast";
import { FLASH_COOKIE } from "@/lib/flash-shared";

function readFlashCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${FLASH_COOKIE}=`));

  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function clearFlashCookie() {
  document.cookie = `${FLASH_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
}

export default function SignInToast() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readFlashCookie() !== "signed_in") {
      return;
    }

    clearFlashCookie();
    queueMicrotask(() => setOpen(true));
  }, []);

  const closeToast = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Toast
      open={open}
      title="Welcome"
      message="Welcome back. You're signed in."
      onClose={closeToast}
    />
  );
}
