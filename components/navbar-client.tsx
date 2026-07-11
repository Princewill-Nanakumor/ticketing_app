"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { logout } from "@/app/actions/auth";
import {
  syncNavbarAuth,
  type NavbarAuth,
} from "@/app/actions/navbar-auth";
import { NAVBAR_SYNC_EVENT } from "@/lib/navbar-sync";

const linkBaseClass =
  "block px-2 py-2 text-sm transition hover:text-ink md:inline-block md:py-1.5";

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
  const [auth, setAuth] = useState<NavbarAuth>({
    firstName: firstName ?? null,
    isAuthenticated,
    isAdmin,
    ticketCount,
  });
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    function refreshAuth() {
      startTransition(async () => {
        const next = await syncNavbarAuth();
        if (cancelled) {
          return;
        }

        setAuth((current) => {
          if (current.isAuthenticated && !next.isAuthenticated) {
            queueMicrotask(() => router.refresh());
          }
          return next;
        });
      });
    }

    refreshAuth();

    function onNavbarSync() {
      refreshAuth();
    }

    window.addEventListener(NAVBAR_SYNC_EVENT, onNavbarSync);

    return () => {
      cancelled = true;
      window.removeEventListener(NAVBAR_SYNC_EVENT, onNavbarSync);
    };
  }, [pathname, router]);

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
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
      <nav className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-16">
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
                <span className="ml-1 text-sage">({auth.ticketCount})</span>
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
                <button
                  type="submit"
                  className="w-full cursor-pointer border border-red-700/40 bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800 md:w-auto md:py-1.5"
                >
                  Log out
                </button>
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
