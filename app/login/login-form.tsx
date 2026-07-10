"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { FiLoader } from "react-icons/fi";
import { login } from "@/app/actions/auth";
import { initialAuthState } from "@/app/actions/auth-state";
import PasswordInput from "@/components/password-input";

const fieldClass =
  "w-full border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition hover:border-ink/35 focus-visible:border-brass focus-visible:outline-none";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";

type LoginValues = {
  email: string;
  password: string;
};

const emptyValues: LoginValues = {
  email: "",
  password: "",
};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialAuthState);
  const [values, setValues] = useState<LoginValues>(emptyValues);
  const errors = state.errors ?? {};

  return (
    <form className="mt-10 space-y-6" action={formAction} noValidate>
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
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Password
        </label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          className={`${fieldClass} ${errors.password ? fieldErrorClass : ""}`}
        />
        {errors.password ? (
          <p id="password-error" className="text-sm text-red-800">
            {errors.password}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p className="text-sm text-red-800" role="status">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-pointer disabled:opacity-70 sm:w-auto"
      >
        {pending ? (
          <>
            <FiLoader aria-hidden className="spinner size-4" />
            <span>Logging in…</span>
          </>
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-sm text-sage">
        No account yet?{" "}
        <Link
          href="/register"
          className="text-ink underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
