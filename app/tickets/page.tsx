import Link from "next/link";

export default function TicketsPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink sm:px-10 lg:px-16">
      <p className="font-(family-name:--font-helix-display) text-3xl tracking-[0.02em]">
        Helix
      </p>
      <h1 className="mt-8 font-(family-name:--font-helix-display) text-4xl leading-tight">
        Tickets
      </h1>
      <p className="mt-4 max-w-md text-sage">
        Your open and resolved requests will appear here.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
        <Link
          href="/tickets/new"
          className="inline-flex items-center justify-center bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink-soft"
        >
          Submit a ticket
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center border border-ink/20 px-6 py-3 text-sm font-medium text-ink transition hover:border-ink"
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
