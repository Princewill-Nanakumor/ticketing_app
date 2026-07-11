"use client";

import { useState, type ChangeEvent } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

type PasswordInputProps = {
  id: string;
  name?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

export default function PasswordInput({
  id,
  name = "password",
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  disabled,
  className,
  ...aria
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
        className={`${className ?? ""} pr-12`}
        {...aria}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-sage transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-70"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <FiEyeOff aria-hidden className="size-4" />
        ) : (
          <FiEye aria-hidden className="size-4" />
        )}
      </button>
    </div>
  );
}
