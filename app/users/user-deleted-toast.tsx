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

export default function UserDeletedToast() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readFlashCookie() !== "user_deleted") {
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
      title="User deleted"
      message="The user was deleted successfully."
      onClose={closeToast}
    />
  );
}
