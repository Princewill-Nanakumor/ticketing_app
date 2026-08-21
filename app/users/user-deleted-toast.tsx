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

export default function UserDeletedToast({
  flash = null,
}: {
  flash?: string | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shouldShow =
      flash === "user_deleted" || readFlashCookie() === "user_deleted";

    if (!shouldShow) {
      return;
    }

    clearFlashCookie();
    queueMicrotask(() => setOpen(true));
  }, [flash]);

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
