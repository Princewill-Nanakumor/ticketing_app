import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTicketById } from "@/app/actions/tickets";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { getPriorityClass } from "@/lib/utils";

type TicketDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function TicketDetailPage({
  params,
}: TicketDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (AUTH_ENABLED && !user) {
    redirect("/login");
  }

  const ticket = await getTicketById(id);

  if (!ticket) {
    notFound();
  }

  const admin = isAdmin(user);

  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/tickets"
          className="text-sm text-sage transition hover:text-ink"
        >
          ← Back to tickets
        </Link>

        <p className="mt-8 text-sm text-sage">Ticket ID</p>
        <p className="mt-1 font-(family-name:--font-helix-display) text-2xl tracking-[0.02em] text-ink">
          {ticket.id}
        </p>

        <div className="mt-8">
          <p className="text-sm text-sage">Subject</p>
          <h1 className="mt-1 font-(family-name:--font-helix-display) text-4xl leading-tight">
            {ticket.subject}
          </h1>
        </div>

        <div className="mt-6">
          <p className="text-sm text-sage">Priority</p>
          <p className={`mt-1 ${getPriorityClass(ticket.priority)}`}>
            {ticket.priority}
          </p>
          <p className="mt-3 text-sm text-sage">Status</p>
          <p className="mt-1 capitalize text-ink">{ticket.status}</p>
        </div>

        <section className="mt-10 border-t border-ink/10 pt-8">
          <h2 className="text-sm font-normal text-sage">Description</h2>
          <p className="mt-4 whitespace-pre-wrap text-base leading-relaxed text-ink-soft">
            {ticket.description}
          </p>
        </section>

        <dl className="mt-10 space-y-4 border-t border-ink/10 pt-8 text-sm">
          <div>
            <dt className="text-sage">Submitted</dt>
            <dd className="mt-1 text-ink">{formatDate(ticket.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-sage">Updated</dt>
            <dd className="mt-1 text-ink">{formatDate(ticket.updatedAt)}</dd>
          </div>
          {admin ? (
            <div>
              <dt className="text-sage">Submitted by</dt>
              <dd className="mt-1 text-ink">
                {ticket.user.name} · {ticket.user.email}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </main>
  );
}
