"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { logout } from "@/app/actions/auth";

const linkBaseClass =
  "block px-2 py-2 text-sm transition hover:text-ink md:inline-block md:py-1.5";

export default function NavbarClient({
  userName,
  isAuthenticated,
  isAdmin = false,
}: {
  userName?: string | null;
  isAuthenticated: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function closeMenu() {
    setOpen(false);
  }

  function isActive(href: string) {
    if (pathname === href) {
      return true;
    }

    // Keep "My Tickets" active on ticket detail, but not on /tickets/new
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
    <header className="relative border-b border-ink/10 bg-paper">
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
          } absolute inset-x-0 top-[3.75rem] z-50 flex-col gap-1 border-b border-ink/10 bg-paper px-6 py-4 sm:px-10 md:static md:inset-auto md:top-auto md:z-auto md:flex md:flex-row md:items-center md:gap-4 md:border-0 md:bg-transparent md:p-0 lg:px-0`}
        >
          {isAuthenticated ? (
            <>
              {userName ? (
                <p className="px-2 py-2 text-sm text-sage md:hidden">
                  Signed in as {userName}
                </p>
              ) : null}
              <Link
                href="/tickets"
                className={navLinkClass("/tickets")}
                onClick={closeMenu}
                aria-current={isActive("/tickets") ? "page" : undefined}
              >
                {isAdmin ? "All Tickets" : "My Tickets"}
              </Link>
              <Link
                href="/tickets/new"
                className={navLinkClass("/tickets/new")}
                onClick={closeMenu}
                aria-current={isActive("/tickets/new") ? "page" : undefined}
              >
                New Ticket
              </Link>
              {isAdmin ? (
                <Link
                  href="/users"
                  className={navLinkClass("/users")}
                  onClick={closeMenu}
                  aria-current={isActive("/users") ? "page" : undefined}
                >
                  Users
                </Link>
              ) : null}
              {userName ? (
                <span className="hidden text-sm text-sage md:inline">
                  {userName}
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
                className={navLinkClass("/login")}
                onClick={closeMenu}
                aria-current={isActive("/login") ? "page" : undefined}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={navLinkClass("/register")}
                onClick={closeMenu}
                aria-current={isActive("/register") ? "page" : undefined}
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
