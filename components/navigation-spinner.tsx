"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import PageSpinner from "@/components/page-spinner";

type Listener = () => void;

let loading = false;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startNavigationLoading() {
  loading = true;
  emit();
}

export function stopNavigationLoading() {
  loading = false;
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return loading;
}

function getServerSnapshot() {
  return false;
}

function isInternalNavigation(anchor: HTMLAnchorElement, event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) {
    return false;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  if (anchor.target && anchor.target !== "_self") {
    return false;
  }

  if (anchor.hasAttribute("download")) {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  let url: URL;

  try {
    url = new URL(href, window.location.href);
  } catch {
    return false;
  }

  if (url.origin !== window.location.origin) {
    return false;
  }

  return (
    url.pathname !== window.location.pathname ||
    url.search !== window.location.search
  );
}

export default function NavigationSpinner() {
  const pathname = usePathname();
  const visible = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    stopNavigationLoading();
  }, [pathname]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (isInternalNavigation(anchor, event)) {
        startNavigationLoading();
      }
    }

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeout = window.setTimeout(() => {
      stopNavigationLoading();
    }, 12_000);

    return () => window.clearTimeout(timeout);
  }, [visible, pathname]);

  if (!visible) {
    return null;
  }

  return <PageSpinner overlay label="Loading page" />;
}
