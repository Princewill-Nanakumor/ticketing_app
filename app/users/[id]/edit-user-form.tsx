"use client";

import { useActionState, useCallback, useState } from "react";
import Link from "next/link";
import { FiLoader } from "react-icons/fi";
import {
  initialUpdateUserState,
  type UpdateUserState,
} from "@/app/actions/users-schema";
import PasswordInput from "@/components/password-input";
import Toast from "@/components/toast";

const fieldClass =
  "w-full border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition hover:border-ink/35 focus-visible:border-brass focus-visible:outline-none";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";

type EditUserFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "USER" | "ADMIN";
  };
  action: (
    prevState: UpdateUserState,
    formData: FormData,
  ) => Promise<UpdateUserState>;
  lockEmail?: boolean;
};

export default function EditUserForm({
  user,
  action,
  lockEmail = false,
}: EditUserFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialUpdateUserState,
  );
  const [values, setValues] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    password: "",
  });
  const [toastClosed, setToastClosed] = useState(false);
  const [handledMessage, setHandledMessage] = useState<string | null>(null);
  const errors = state.errors ?? {};

  if (
    state.success &&
    state.message &&
    state.message !== handledMessage
  ) {
    setHandledMessage(state.message);
    setToastClosed(false);
  }

  const closeToast = useCallback(() => {
    setToastClosed(true);
  }, []);

  return (
    <>
      <form className="mt-10 space-y-6" action={formAction} noValidate>
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
          <label htmlFor="email" className="block text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            readOnly={lockEmail}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`${fieldClass} ${errors.email ? fieldErrorClass : ""} ${
              lockEmail ? "opacity-70" : ""
            }`}
          />
          {errors.email ? (
            <p id="email-error" className="text-sm text-red-800">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="block text-sm font-medium text-ink">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={values.role}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                role: event.target.value as "USER" | "ADMIN",
              }))
            }
            aria-invalid={Boolean(errors.role)}
            aria-describedby={errors.role ? "role-error" : undefined}
            className={`${fieldClass} ${errors.role ? fieldErrorClass : ""}`}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
          {errors.role ? (
            <p id="role-error" className="text-sm text-red-800">
              {errors.role}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink"
          >
            New password
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
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error" : "password-hint"
            }
            className={`${fieldClass} ${errors.password ? fieldErrorClass : ""}`}
          />
          {errors.password ? (
            <p id="password-error" className="text-sm text-red-800">
              {errors.password}
            </p>
          ) : (
            <p id="password-hint" className="text-sm text-sage">
              Leave blank to keep the current password. New passwords need at
              least 8 characters, a capital letter at the start, a number, and a
              special character.
            </p>
          )}
        </div>

        {state.message && !state.success ? (
          <p className="text-sm text-red-800" role="status">
            {state.message}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-pointer disabled:opacity-70 sm:w-auto"
          >
            {pending ? (
              <>
                <FiLoader aria-hidden className="spinner size-4" />
                <span>Saving…</span>
              </>
            ) : (
              "Save changes"
            )}
          </button>
          <Link
            href="/users"
            className="inline-flex w-full cursor-pointer items-center justify-center border border-ink/20 px-7 py-3.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40 sm:w-auto"
          >
            Back to users
          </Link>
        </div>
      </form>

      <Toast
        open={state.success && !toastClosed}
        title="User updated"
        message={state.message ?? "User updated successfully."}
        onClose={closeToast}
      />
    </>
  );
}
