import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsers } from "@/app/actions/users";
import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { isAdminEmail } from "@/lib/admin";
import DeleteUserButton from "./delete-user-button";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!isAdmin(currentUser)) {
    redirect("/tickets");
  }

  const users = await getUsers();

  return (
    <main className="min-h-screen bg-paper px-6 py-10 text-ink sm:px-10 lg:px-16">
      <div className="mx-auto w-full max-w-4xl">
        <div>
          <h1 className="font-(family-name:--font-helix-display) text-4xl leading-tight">
            Users
          </h1>
          <p className="mt-4 max-w-md text-sage">
            View, edit, or remove accounts across Helix.
          </p>
        </div>

        {users.length === 0 ? (
          <p className="mt-14 border-t border-ink/10 pt-10 text-sage">
            No users found.
          </p>
        ) : (
          <ul className="mt-14 divide-y divide-ink/10 border-t border-ink/10">
            {users.map((user) => {
              const isSelf = user.id === currentUser.id;
              const isPrimaryAdmin = isAdminEmail(user.email);
              const canDelete = !isSelf && !isPrimaryAdmin;

              return (
                <li key={user.id} className="py-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-(family-name:--font-helix-display) text-xl leading-snug">
                        {user.name}
                      </p>
                      <p className="mt-1 text-sm text-ink">{user.id}</p>
                      <p className="mt-2 text-sm text-sage">{user.email}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sage">
                        <p className="capitalize">{user.role.toLowerCase()}</p>
                        <p>
                          {user._count.tickets} ticket
                          {user._count.tickets === 1 ? "" : "s"}
                        </p>
                        <p>Joined {formatDate(user.createdAt)}</p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Link
                        href={`/users/${user.id}`}
                        className="inline-flex w-full cursor-pointer items-center justify-center border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-mist/40 sm:w-auto"
                      >
                        Edit
                      </Link>
                      {canDelete ? (
                        <DeleteUserButton
                          userId={user.id}
                          userName={user.name}
                        />
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
