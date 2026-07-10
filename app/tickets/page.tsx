import Link from "next/link";
import { redirect } from "next/navigation";
import { getTickets } from "@/app/actions/tickets";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { getPriorityClass } from "@/lib/utils";
import SignInToast from "./sign-in-toast";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

type TicketsPageProps = {
  searchParams: Promise<{ signedIn?: string }>;
};

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (AUTH_ENABLED && !user) {
    redirect("/login");
  }

  const tickets = await getTickets();
  const admin = isAdmin(user);
  const showSignInToast = params.signedIn === "1";

  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-(family-name:--font-helix-display) text-4xl leading-tight">
              {admin ? "All tickets" : "Your tickets"}
            </h1>
            <p className="mt-4 max-w-md text-sage">
              {admin
                ? "Admin view of every request across Helix."
                : "Open and resolved requests you have submitted."}
            </p>
          </div>

          <Link
            href="/tickets/new"
            className="inline-flex cursor-pointer items-center justify-center bg-ink px-6 py-3 text-sm font-medium text-paper transition hover:bg-ink-soft"
          >
            Submit a ticket
          </Link>
        </div>

        {tickets.length === 0 ? (
          <p className="mt-14 border-t border-ink/10 pt-10 text-sage">
            No tickets yet.{" "}
            <Link
              href="/tickets/new"
              className="text-ink underline-offset-4 hover:underline"
            >
              Submit the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-14 divide-y divide-ink/10 border-t border-ink/10">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-(family-name:--font-helix-display) text-xl leading-snug">
                      {ticket.subject}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-sage">
                      {ticket.description}
                    </p>
                    {admin ? (
                      <p className="mt-3 text-sm text-sage">
                        From {ticket.user.name} · {ticket.user.email}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <p className={getPriorityClass(ticket.priority)}>
                        {ticket.priority}
                      </p>
                      <p className="capitalize text-sage">{ticket.status}</p>
                      <p className="text-sage">{formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>

                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="inline-flex w-full cursor-pointer items-center justify-center border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40 sm:w-auto"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SignInToast show={showSignInToast} />
    </main>
  );
}
