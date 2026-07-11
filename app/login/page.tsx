import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/tickets");
  }

  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-(family-name:--font-helix-display) text-4xl leading-tight">
          Sign in
        </h1>
        <p className="mt-4 text-sage">
          Access your tickets, or the full queue if you administer Helix.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
