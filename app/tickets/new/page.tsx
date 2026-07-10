import { redirect } from "next/navigation";
import { AUTH_ENABLED } from "@/lib/auth-config";
import { getCurrentUser } from "@/lib/current-user";
import TicketForm from "./ticket-form";

export default async function NewTicketPage() {
  if (AUTH_ENABLED) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-xl">
        <h1 className="font-(family-name:--font-helix-display) text-4xl leading-tight sm:text-5xl">
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
