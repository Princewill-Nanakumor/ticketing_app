import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUserById, updateUser } from "@/app/actions/users";
import { isAdminEmail } from "@/lib/admin";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import EditUserForm from "./edit-user-form";

type EditUserPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: EditUserPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!isAdmin(currentUser)) {
    redirect("/tickets");
  }

  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  const updateUserWithId = updateUser.bind(null, user.id);

  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href="/users"
          className="text-sm text-sage underline-offset-4 hover:text-ink hover:underline"
        >
          Back to users
        </Link>
        <h1 className="mt-8 font-(family-name:--font-helix-display) text-4xl leading-tight">
          Edit user
        </h1>
        <p className="mt-2 text-sm text-sage">User ID · {user.id}</p>
        <p className="mt-4 text-sage">
          Update account details for {user.name}.
        </p>
        <EditUserForm
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          action={updateUserWithId}
          lockEmail={isAdminEmail(user.email)}
        />
      </div>
    </main>
  );
}
