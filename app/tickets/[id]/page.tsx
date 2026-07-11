import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTicketById } from "@/app/actions/tickets";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { formatStatusLabel } from "@/lib/ticket-activity";
import { getPriorityClass } from "@/lib/utils";
import CloseTicketButton from "../close-ticket-button";
import TicketClosedToast from "../ticket-closed-toast";
import CommentForm from "./comment-form";

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
  const canManage = Boolean(user && (admin || ticket.userId === user.id));
  const isClosed = ticket.status === "closed";
  const struck = isClosed ? "line-through decoration-ink/30" : "";

  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/tickets"
          className="text-sm text-sage transition hover:text-ink"
        >
          ← Back to tickets
        </Link>

        <div
          className={`mt-8 ${
            isClosed
              ? "border border-ink/10 bg-mist/40 p-6 opacity-60 sm:p-8"
              : ""
          }`}
        >
          <div>
            <p className={`text-sm text-sage ${struck}`}>Ticket ID</p>
            <p
              className={`mt-1 font-(family-name:--font-helix-display) text-2xl tracking-[0.02em] text-ink ${struck}`}
            >
              {ticket.id}
            </p>
          </div>

          <div className="mt-8">
            <p className={`text-sm text-sage ${struck}`}>Subject</p>
            <h1
              className={`mt-1 font-(family-name:--font-helix-display) text-4xl leading-tight ${struck}`}
            >
              {ticket.subject}
            </h1>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className={`text-sm text-sage ${struck}`}>Priority</p>
              <p
                className={`mt-1 ${getPriorityClass(ticket.priority)} ${struck}`}
              >
                {ticket.priority}
              </p>
            </div>
            <div>
              <p className={`text-sm text-sage ${struck}`}>Status</p>
              <p className={`mt-1 capitalize text-ink ${struck}`}>
                {formatStatusLabel(ticket.status)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className={`text-sm text-sage ${struck}`}>Submitted by</p>
              <p className={`mt-1 text-ink ${struck}`}>
                {ticket.user.name} · {ticket.user.email}
              </p>
              <p className={`mt-1 text-sm text-sage ${struck}`}>
                {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>

          <section className="mt-10 border-t border-ink/10 pt-8">
            <h2 className={`text-sm font-normal text-sage ${struck}`}>
              Description
            </h2>
            <p
              className={`mt-4 whitespace-pre-wrap text-2xl leading-relaxed text-ink sm:text-3xl ${struck}`}
            >
              {ticket.description}
            </p>
          </section>

          <section className="mt-10 border-t border-ink/10 pt-8">
            <h2 className={`text-sm font-normal text-sage ${struck}`}>
              Conversations
            </h2>
            <ul className="mt-6 space-y-4">
              {ticket.comments.length === 0 ? (
                <li className={`text-sm text-sage ${struck}`}>No replies yet.</li>
              ) : (
                ticket.comments.map((comment) => {
                  const fromAdmin = comment.author.role === "ADMIN";

                  return (
                    <li
                      key={comment.id}
                      className={`flex ${fromAdmin ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] border px-4 py-3 sm:max-w-[75%] ${
                          fromAdmin
                            ? "border-ink/10 bg-mist/40 text-left"
                            : "border-ink/20 bg-ink text-right text-paper"
                        } ${isClosed ? "opacity-70" : ""}`}
                      >
                        <p
                          className={`text-sm ${
                            fromAdmin ? "text-sage" : "text-mist"
                          } ${struck}`}
                        >
                          {fromAdmin ? "Admin · " : ""}
                          {comment.author.name} ·{" "}
                          {formatDate(comment.createdAt)}
                        </p>
                        <p
                          className={`mt-2 whitespace-pre-wrap text-left text-base leading-relaxed ${
                            fromAdmin ? "text-ink" : "text-paper"
                          } ${struck}`}
                        >
                          {comment.body}
                        </p>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
            {canManage && !isClosed ? (
              <div className="mt-6">
                <CommentForm ticketId={ticket.id} />
              </div>
            ) : null}
            {isClosed ? (
              <p className="mt-6 text-sm text-sage">
                This ticket is closed. New replies are disabled.
              </p>
            ) : null}
          </section>

          <section className="mt-10 border-t border-ink/10 pt-8">
            <h2 className={`text-sm font-normal text-sage ${struck}`}>
              Activity
            </h2>
            <ul className="mt-6 space-y-4">
              {ticket.activities.length === 0 ? (
                <li className={`text-sm text-sage ${struck}`}>No activity yet.</li>
              ) : (
                ticket.activities.map((activity) => (
                  <li key={activity.id} className="text-sm">
                    <p className={`text-ink ${struck}`}>
                      <span className="font-medium">{activity.actor.name}</span>{" "}
                      {activity.detail ?? activity.action}
                    </p>
                    <p className={`mt-1 text-sage ${struck}`}>
                      {formatDate(activity.createdAt)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {canManage && !isClosed ? (
          <div className="mt-10 flex justify-end border-t border-ink/10 pt-8">
            <CloseTicketButton
              ticketId={ticket.id}
              redirectTo={`/tickets/${ticket.id}`}
              fullWidth={false}
            />
          </div>
        ) : null}
      </div>

      <TicketClosedToast />
    </main>
  );
}
