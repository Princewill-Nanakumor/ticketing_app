import Link from "next/link";
import { redirect } from "next/navigation";
import { getTickets } from "@/app/actions/tickets";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { getPriorityClass } from "@/lib/utils";
import CloseTicketButton from "./close-ticket-button";
import SignInToast from "./sign-in-toast";
import TicketClosedToast from "./ticket-closed-toast";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function TicketsPage() {
  const user = await getCurrentUser();

  if (AUTH_ENABLED && !user) {
    redirect("/login");
  }

  const tickets = await getTickets();
  const admin = isAdmin(user);
  const ticketCount = tickets.length;

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
            <p className="mt-2 text-sm text-ink">
              {ticketCount} ticket{ticketCount === 1 ? "" : "s"}
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
            {tickets.map((ticket) => {
              const isClosed = ticket.status === "closed";
              const struck = isClosed ? "line-through decoration-ink/30" : "";

              return (
                <li
                  key={ticket.id}
                  className={`py-6 ${
                    isClosed ? "bg-mist/35 px-4 opacity-60 sm:px-5" : ""
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <p
                        className={`font-(family-name:--font-helix-display) text-xl leading-snug ${struck}`}
                      >
                        {ticket.subject}
                      </p>
                      <p
                        className={`mt-2 line-clamp-2 text-sm leading-relaxed text-sage ${struck}`}
                      >
                        {ticket.description}
                      </p>
                      {admin ? (
                        <p className={`mt-3 text-sm text-sage ${struck}`}>
                          From {ticket.user.name} · {ticket.user.email}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <p
                          className={`${getPriorityClass(ticket.priority)} ${struck}`}
                        >
                          {ticket.priority}
                        </p>
                        <p className={`capitalize text-sage ${struck}`}>
                          {ticket.status.replaceAll("_", " ")}
                        </p>
                        <p className={`text-sage ${struck}`}>
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="inline-flex w-full cursor-pointer items-center justify-center border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40 sm:w-auto"
                      >
                        View
                      </Link>
                      {!isClosed &&
                      user &&
                      (admin || ticket.userId === user.id) ? (
                        <CloseTicketButton ticketId={ticket.id} />
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SignInToast />
      <TicketClosedToast />
    </main>
  );
}
