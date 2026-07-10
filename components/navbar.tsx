import { getCurrentUser, isAdmin } from "@/lib/current-user";
import NavbarClient from "@/components/navbar-client";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <NavbarClient
      userName={user?.name ?? null}
      isAuthenticated={Boolean(user)}
      isAdmin={isAdmin(user)}
    />
  );
}
