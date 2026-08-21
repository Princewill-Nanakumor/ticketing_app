import { FiLoader } from "react-icons/fi";

export default function PageSpinner({
  overlay = false,
  label = "Loading",
}: {
  overlay?: boolean;
  label?: string;
}) {
  const spinner = (
    <FiLoader aria-hidden className="spinner size-8 text-ink" />
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-paper/75 backdrop-blur-[1px]"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[calc(100vh-var(--helix-nav-height))] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {spinner}
    </div>
  );
}
