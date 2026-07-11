"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/app/actions/auth";
import { getPasswordHint } from "@/app/actions/auth-schema";
import { initialAuthState } from "@/app/actions/auth-state";
import PasswordInput from "@/components/password-input";
import Toast from "@/components/toast";

const fieldClass =
  "w-full border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition hover:border-ink/35 focus-visible:border-brass focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";
const fieldsetClass =
  "m-0 min-w-0 space-y-6 border-0 p-0 disabled:opacity-70";

type RegisterValues = {
  name: string;
  email: string;
  password: string;
};

const emptyValues: RegisterValues = {
  name: "",
  email: "",
  password: "",
};

export default function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    register,
    initialAuthState,
  );
  const [values, setValues] = useState<RegisterValues>(emptyValues);
  const [toastOpen, setToastOpen] = useState(false);
  const [handledMessage, setHandledMessage] = useState<string | null>(null);
  const errors = state.errors ?? {};
  const passwordHint =
    values.password.length > 0 ? getPasswordHint(values.password) : null;
  const showPasswordHint = Boolean(passwordHint);

  if (
    state.success &&
    state.message &&
    state.message !== handledMessage
  ) {
    setHandledMessage(state.message);
    setToastOpen(true);
  }

  const closeToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  useEffect(() => {
    if (!state.success || !toastOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [state.success, toastOpen, router]);

  const formLocked = pending || state.success;

  return (
    <>
      <form className="mt-10 space-y-6" action={formAction} noValidate>
        <fieldset disabled={formLocked} className={fieldsetClass}>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-ink">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={`${fieldClass} ${errors.name ? fieldErrorClass : ""}`}
            />
            {errors.name ? (
              <p id="name-error" className="text-sm text-red-800">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`${fieldClass} ${errors.email ? fieldErrorClass : ""}`}
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-red-800">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink"
            >
              Password
            </label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={values.password}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              aria-invalid={Boolean(errors.password) || showPasswordHint}
              aria-describedby={
                errors.password
                  ? "password-error"
                  : showPasswordHint
                    ? "password-hint"
                    : undefined
              }
              className={`${fieldClass} ${
                errors.password || showPasswordHint ? fieldErrorClass : ""
              }`}
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-red-800">
                {errors.password}
              </p>
            ) : showPasswordHint ? (
              <p id="password-hint" className="text-sm text-red-800">
                {passwordHint}
              </p>
            ) : null}
          </div>

          {state.message && !state.success ? (
            <p className="text-sm text-red-800" role="status">
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {pending
              ? "Creating…"
              : state.success
                ? "Account created"
                : "Create account"}
          </button>
        </fieldset>

        <p className="mt-3 text-sm text-sage">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-ink underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>

      <Toast
        open={toastOpen}
        title="Account created"
        message={
          state.message ??
          "Account created successfully. Redirecting you to sign in…"
        }
        onClose={closeToast}
      />
    </>
  );
}
