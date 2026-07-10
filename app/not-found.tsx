import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-16 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <Link
          href="/"
          className="font-(family-name:--font-helix-display) text-2xl leading-normal tracking-[0.02em] text-ink transition hover:text-ink-soft"
        >
          Helix
        </Link>

        <p className="mt-10 font-(family-name:--font-helix-display) text-7xl tracking-[0.02em] text-sage sm:text-8xl">
          404
        </p>
        <h1 className="mt-3 text-4xl font-semibold leading-normal tracking-tight text-ink sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-sage">
          That page does not exist, or you do not have access to it.
        </p>

        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center justify-center bg-ink px-7 py-3.5 text-sm font-medium tracking-wide text-paper transition hover:bg-ink-soft"
          >
            Back home
          </Link>
          <Link
            href="/tickets"
            className="inline-flex cursor-pointer items-center justify-center border border-ink/20 px-7 py-3.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40"
          >
            View tickets
          </Link>
        </div>
      </div>
    </main>
  );
}
