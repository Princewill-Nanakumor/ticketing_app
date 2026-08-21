"use client";

import {
  useActionState,
  useState,
  type FormEvent,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { FiLoader } from "react-icons/fi";
import { login } from "@/app/actions/auth";
import { getAuthFieldErrors, loginSchema } from "@/app/actions/auth-schema";
import { initialAuthState, type AuthState } from "@/app/actions/auth-state";
import PasswordInput from "@/components/password-input";
import { useDismissedErrors } from "@/lib/dismissed-form-errors";

const fieldClass =
  "w-full border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition hover:border-ink/35 focus-visible:border-brass focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";
const fieldsetClass =
  "m-0 min-w-0 space-y-6 border-0 p-0 disabled:opacity-70";

type LoginValues = {
  email: string;
  password: string;
};

const emptyValues: LoginValues = {
  email: "",
  password: "",
};

function SignInButton({ loading }: { loading: boolean }) {
  const { pending } = useFormStatus();
  const loggingIn = pending || loading;

  return (
    <button
      type="submit"
      aria-busy={loggingIn}
      className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
    >
      {loggingIn ? (
        <>
          <FiLoader aria-hidden className="spinner size-4" />
          <span>Logging in…</span>
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(login, initialAuthState);
  const [values, setValues] = useState<LoginValues>(emptyValues);
  const [clientState, setClientState] = useState<AuthState | null>(null);
  const [submitId, setSubmitId] = useState(0);
  const [settledId, setSettledId] = useState(0);
  const [prevState, setPrevState] = useState(state);
  const { dismiss, resetDismissed, fieldError, formMessage } =
    useDismissedErrors();

  if (prevState !== state) {
    setPrevState(state);
    setSettledId(submitId);
  }

  const loggingIn = submitId !== settledId;
  const displayState = loggingIn ? initialAuthState : (clientState ?? state);
  const emailError = fieldError(displayState.errors, "email");
  const passwordError = fieldError(displayState.errors, "password");
  const message = formMessage(displayState.message);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    resetDismissed();
    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      event.preventDefault();
      setClientState({
        success: false,
        message: "Please fix the errors above.",
        errors: getAuthFieldErrors(parsed.error),
      });
      return;
    }

    setClientState(null);
    setSubmitId((id) => id + 1);
  }

  return (
    <form
      className="mt-10 space-y-6"
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      aria-busy={loggingIn}
    >
      <fieldset className={fieldsetClass}>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-ink">
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
            disabled={loggingIn}
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
            autoComplete="current-password"
            value={values.password}
            onChange={(event) => {
              dismiss("password");
              setValues((current) => ({
                ...current,
                password: event.target.value,
              }));
            }}
            disabled={loggingIn}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "password-error" : undefined}
            className={`${fieldClass} ${passwordError ? fieldErrorClass : ""}`}
          />
          {passwordError ? (
            <p id="password-error" className="text-sm text-red-800">
              {passwordError}
            </p>
          ) : null}
        </div>

        {message ? (
          <p className="text-sm text-red-800" role="status">
            {message}
          </p>
        ) : null}

        <SignInButton loading={loggingIn} />
      </fieldset>

      <p className="mt-3 text-sm text-sage">
        No account yet?{" "}
        <Link
          href="/register"
          className="text-ink underline underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
