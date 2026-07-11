import { getCurrentUser, isAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import NavbarClient from "@/components/navbar-client";

function getFirstName(name?: string | null) {
  if (!name) {
    return null;
  }

  const first = name.trim().split(/\s+/)[0];
  return first || null;
}

export default async function Navbar() {
  const user = await getCurrentUser();
  const admin = isAdmin(user);
  const ticketCount = user
    ? await prisma.ticket.count({
        where: admin ? undefined : { userId: user.id },
      })
    : 0;

  return (
    <NavbarClient
      firstName={getFirstName(user?.name)}
      isAuthenticated={Boolean(user)}
      isAdmin={admin}
      ticketCount={ticketCount}
    />
  );
}
