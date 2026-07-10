"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Toast from "@/components/toast";

export default function SignInToast({ show }: { show: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(show);

  useEffect(() => {
    if (!show) {
      return;
    }

    setOpen(true);
    router.replace(pathname);
  }, [show, router, pathname]);

  const closeToast = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Toast
      open={open}
      title="Signed in"
      message="Signed in successfully."
      onClose={closeToast}
    />
  );
}
