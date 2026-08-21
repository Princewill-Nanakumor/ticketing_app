"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/app/actions/auth";
import {
  getAuthFieldErrors,
  getPasswordHint,
  registerSchema,
} from "@/app/actions/auth-schema";
import { initialAuthState, type AuthState } from "@/app/actions/auth-state";
import PasswordInput from "@/components/password-input";
import Toast from "@/components/toast";
import { useDismissedErrors } from "@/lib/dismissed-form-errors";

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
  const [state, formAction] = useActionState(register, initialAuthState);
  const [values, setValues] = useState<RegisterValues>(emptyValues);
  const [submitting, setSubmitting] = useState(false);
  const [clientState, setClientState] = useState<AuthState | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [handledMessage, setHandledMessage] = useState<string | null>(null);
  const [prevState, setPrevState] = useState(state);
  const { dismiss, resetDismissed, fieldError, formMessage } =
    useDismissedErrors();

  if (prevState !== state) {
    setPrevState(state);
    setSubmitting(false);
  }

  const displayState = submitting ? initialAuthState : (clientState ?? state);
  const nameError = fieldError(displayState.errors, "name");
  const emailError = fieldError(displayState.errors, "email");
  const passwordError = fieldError(displayState.errors, "password");
  const message = formMessage(displayState.message);
  const passwordHint =
    values.password.length > 0 ? getPasswordHint(values.password) : null;
  const showPasswordHint = Boolean(passwordHint) && !passwordError;

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

  const formLocked = submitting || state.success;

  function handleAction(formData: FormData) {
    resetDismissed();
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setSubmitting(false);
      setClientState({
        success: false,
        message: "Please fix the errors above.",
        errors: getAuthFieldErrors(parsed.error),
      });
      return;
    }

    setClientState(null);
    setSubmitting(true);
    formAction(formData);
  }

  return (
    <>
      <form
        className="mt-10 space-y-6"
        action={handleAction}
        noValidate
        aria-busy={submitting}
      >
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
              onChange={(event) => {
                dismiss("name");
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }));
              }}
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? "name-error" : undefined}
              className={`${fieldClass} ${nameError ? fieldErrorClass : ""}`}
            />
            {nameError ? (
              <p id="name-error" className="text-sm text-red-800">
                {nameError}
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
              onChange={(event) => {
                dismiss("email");
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }));
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              className={`${fieldClass} ${emailError ? fieldErrorClass : ""}`}
            />
            {emailError ? (
              <p id="email-error" className="text-sm text-red-800">
                {emailError}
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
              onChange={(event) => {
                dismiss("password");
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }));
              }}
              aria-invalid={Boolean(passwordError) || showPasswordHint}
              aria-describedby={
                passwordError
                  ? "password-error"
                  : showPasswordHint
                    ? "password-hint"
                    : undefined
              }
              className={`${fieldClass} ${
                passwordError || showPasswordHint ? fieldErrorClass : ""
              }`}
            />
            {passwordError ? (
              <p id="password-error" className="text-sm text-red-800">
                {passwordError}
              </p>
            ) : showPasswordHint ? (
              <p id="password-hint" className="text-sm text-red-800">
                {passwordHint}
              </p>
            ) : null}
          </div>

          {message && !displayState.success ? (
            <p className="text-sm text-red-800" role="status">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {submitting
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
            className="text-ink underline underline-offset-4 hover:underline"
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
