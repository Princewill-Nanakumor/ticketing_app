import Link from "next/link";
import TicketForm from "./ticket-form";

export default function NewTicketPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/"
          className="font-(family-name:--font-helix-display) text-2xl tracking-[0.02em] text-ink transition hover:text-ink-soft"
        >
          Helix
        </Link>

        <h1 className="mt-10 font-(family-name:--font-helix-display) text-4xl leading-tight sm:text-5xl">
          Submit a ticket
        </h1>

        <p className="mt-4 text-sage">
          Share the subject, details, and how urgent this feels.
        </p>

        <TicketForm />
      </div>
    </main>
  );
}
