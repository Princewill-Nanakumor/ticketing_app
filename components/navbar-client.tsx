"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { FiLoader, FiMenu, FiX } from "react-icons/fi";
import { logout } from "@/app/actions/auth";
import {
  syncNavbarAuth,
  type NavbarAuth,
} from "@/app/actions/navbar-auth";
import { startNavigationLoading } from "@/components/navigation-spinner";
import { NAVBAR_SYNC_EVENT } from "@/lib/navbar-sync";

const linkBaseClass =
  "block px-2 py-2 text-sm transition hover:text-ink md:inline-block md:py-1.5";
const SESSION_CHECK_MS = 30_000;

function toAuth(
  firstName: string | null | undefined,
  isAuthenticated: boolean,
  isAdmin: boolean,
  ticketCount: number,
): NavbarAuth {
  return {
    firstName: firstName ?? null,
    isAuthenticated,
    isAdmin,
    ticketCount,
  };
}

function LogoutButton() {
  const { pending } = useFormStatus();

  useEffect(() => {
    if (pending) {
      startNavigationLoading();
    }
  }, [pending]);

  return (
    <button
      type="submit"
      className="flex w-full cursor-pointer items-center justify-center gap-2 border border-red-700/40 bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800 md:w-auto md:py-1.5"
    >
      {pending ? (
        <>
          <FiLoader aria-hidden className="spinner size-4" />
          <span>Logging out…</span>
        </>
      ) : (
        "Log out"
      )}
    </button>
  );
}

export default function NavbarClient({
  firstName,
  isAuthenticated,
  isAdmin = false,
  ticketCount = 0,
}: {
  firstName?: string | null;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  ticketCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const serverAuth = toAuth(firstName, isAuthenticated, isAdmin, ticketCount);
  const [auth, setAuth] = useState<NavbarAuth>(serverAuth);
  const [prevServerAuth, setPrevServerAuth] = useState(serverAuth);
  const inFlightRef = useRef<Promise<NavbarAuth> | null>(null);
  const lastCheckRef = useRef(0);

  if (
    prevServerAuth.firstName !== serverAuth.firstName ||
    prevServerAuth.isAuthenticated !== serverAuth.isAuthenticated ||
    prevServerAuth.isAdmin !== serverAuth.isAdmin ||
    prevServerAuth.ticketCount !== serverAuth.ticketCount
  ) {
    setPrevServerAuth(serverAuth);
    setAuth(serverAuth);
  }

  const refreshAuth = useCallback(
    (force = false) => {
      const now = Date.now();

      if (!force && now - lastCheckRef.current < SESSION_CHECK_MS) {
        return inFlightRef.current;
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      lastCheckRef.current = now;
      const request = syncNavbarAuth()
        .then((next) => {
          setAuth((current) => {
            if (current.isAuthenticated && !next.isAuthenticated) {
              queueMicrotask(() => router.refresh());
            }
            return next;
          });
          return next;
        })
        .finally(() => {
          if (inFlightRef.current === request) {
            inFlightRef.current = null;
          }
        });

      inFlightRef.current = request;
      return request;
    },
    [router],
  );

  useEffect(() => {
    lastCheckRef.current = Date.now();

    function onNavbarSync() {
      void refreshAuth(true);
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        void refreshAuth(false);
      }
    }

    window.addEventListener(NAVBAR_SYNC_EVENT, onNavbarSync);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(NAVBAR_SYNC_EVENT, onNavbarSync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshAuth]);

  function closeMenu() {
    setOpen(false);
  }

  function isActive(href: string) {
    if (pathname === href) {
      return true;
    }

    if (href === "/tickets") {
      return (
        pathname.startsWith("/tickets/") &&
        !pathname.startsWith("/tickets/new")
      );
    }

    if (href === "/users") {
      return pathname.startsWith("/users/");
    }

    return false;
  }

  function navLinkClass(href: string) {
    return `${linkBaseClass} ${
      isActive(href) ? "font-bold text-ink" : "font-normal text-sage"
    }`;
  }

  return (
    <header className="sticky top-0 z-50 h-(--helix-nav-height) border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-full w-full max-w-4xl items-center justify-between gap-4 px-6 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="font-(family-name:--font-helix-display) text-xl tracking-[0.02em] text-ink transition hover:text-ink-soft"
          onClick={closeMenu}
        >
          Helix
        </Link>

        <button
          type="button"
          className="inline-flex cursor-pointer items-center justify-center border border-ink/15 p-2 text-ink md:hidden"
          aria-expanded={open}
          aria-controls="main-nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <FiX aria-hidden className="size-5" />
          ) : (
            <FiMenu aria-hidden className="size-5" />
          )}
        </button>

        <div
          id="main-nav-menu"
          className={`${
            open ? "flex" : "hidden"
          } absolute inset-x-0 top-full z-50 flex-col gap-1 border-b border-ink/10 bg-paper px-6 py-4 shadow-sm sm:px-10 md:static md:inset-auto md:top-auto md:z-auto md:flex md:flex-row md:items-center md:gap-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none lg:px-0`}
        >
          {auth.isAuthenticated ? (
            <>
              {auth.firstName ? (
                <p className="px-2 py-2 text-sm text-sage md:hidden">
                  Hi, {auth.firstName}
                </p>
              ) : null}
              <Link
                href="/tickets"
                className={navLinkClass("/tickets")}
                onClick={closeMenu}
                aria-current={isActive("/tickets") ? "page" : undefined}
              >
                {auth.isAdmin ? "All Tickets" : "My Tickets"}
                <span className="ml-1">({auth.ticketCount})</span>
              </Link>
              <Link
                href="/tickets/new"
                className={navLinkClass("/tickets/new")}
                onClick={closeMenu}
                aria-current={isActive("/tickets/new") ? "page" : undefined}
              >
                New Ticket
              </Link>
              {auth.isAdmin ? (
                <Link
                  href="/users"
                  className={navLinkClass("/users")}
                  onClick={closeMenu}
                  aria-current={isActive("/users") ? "page" : undefined}
                >
                  Users
                </Link>
              ) : null}
              {auth.firstName ? (
                <span className="hidden text-sm text-sage md:inline">
                  Hi, {auth.firstName}
                </span>
              ) : null}
              <form action={logout} className="mt-2 md:mt-0">
                <LogoutButton />
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="mt-1 inline-flex w-full cursor-pointer items-center justify-center border border-ink/20 px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40 md:mt-0 md:w-auto md:py-1.5"
                onClick={closeMenu}
                aria-current={isActive("/login") ? "page" : undefined}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex w-full cursor-pointer items-center justify-center bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-soft md:w-auto md:py-1.5"
                onClick={closeMenu}
                aria-current={isActive("/register") ? "page" : undefined}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
