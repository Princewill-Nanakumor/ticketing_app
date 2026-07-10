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
        className={`${className ?? ""} pr-12`}
        {...aria}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-sage transition hover:text-ink"
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
