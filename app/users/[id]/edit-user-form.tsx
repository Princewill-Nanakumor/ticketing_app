"use client";

import { useActionState, useCallback, useState } from "react";
import { FiLoader } from "react-icons/fi";
import {
  initialUpdateUserState,
  type UpdateUserState,
} from "@/app/actions/users-schema";
import PasswordInput from "@/components/password-input";
import Toast from "@/components/toast";
import { useDismissedErrors } from "@/lib/dismissed-form-errors";

const fieldClass =
  "w-full border border-ink/15 bg-paper px-4 py-3 text-ink placeholder:text-sage/70 transition hover:border-ink/35 focus-visible:border-brass focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70";
const fieldErrorClass = "border-red-700/70 focus-visible:border-red-700";
const fieldsetClass =
  "m-0 min-w-0 space-y-6 border-0 p-0 disabled:opacity-70";

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
  const { dismiss, resetDismissed, fieldError, formMessage } =
    useDismissedErrors();
  const errors = state.errors ?? {};
  const nameError = fieldError(errors, "name");
  const emailError = fieldError(errors, "email");
  const roleError = fieldError(errors, "role");
  const passwordError = fieldError(errors, "password");
  const message = formMessage(state.message);

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
      <form
        className="mt-10 space-y-6"
        action={formAction}
        onSubmit={resetDismissed}
        noValidate
      >
        <fieldset disabled={pending} className={fieldsetClass}>
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
              readOnly={lockEmail}
              onChange={(event) => {
                dismiss("email");
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }));
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              className={`${fieldClass} ${emailError ? fieldErrorClass : ""} ${
                lockEmail ? "opacity-70" : ""
              }`}
            />
            {emailError ? (
              <p id="email-error" className="text-sm text-red-800">
                {emailError}
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
              onChange={(event) => {
                dismiss("role");
                setValues((current) => ({
                  ...current,
                  role: event.target.value as "USER" | "ADMIN",
                }));
              }}
              aria-invalid={Boolean(roleError)}
              aria-describedby={roleError ? "role-error" : undefined}
              className={`${fieldClass} ${roleError ? fieldErrorClass : ""}`}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
            {roleError ? (
              <p id="role-error" className="text-sm text-red-800">
                {roleError}
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
              onChange={(event) => {
                dismiss("password");
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }));
              }}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={
                passwordError ? "password-error" : "password-hint"
              }
              className={`${fieldClass} ${passwordError ? fieldErrorClass : ""}`}
            />
            {passwordError ? (
              <p id="password-error" className="text-sm text-red-800">
                {passwordError}
              </p>
            ) : (
              <p id="password-hint" className="text-sm text-sage">
                Leave blank to keep the current password. New passwords need at
                least 8 characters, a capital letter at the start, a number, and
                a special character.
              </p>
            )}
          </div>

          {message && !state.success ? (
            <p className="text-sm text-red-800" role="status">
              {message}
            </p>
          ) : null}
        </fieldset>

        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={pending}
            className="flex w-full cursor-pointer items-center justify-center gap-2 bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
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
