/** Primary admin email — set ADMIN_EMAIL in .env */
export function getAdminEmail() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error("ADMIN_EMAIL is not set");
  }

  return email;
}

export function isAdminEmail(email: string) {
  try {
    return email.trim().toLowerCase() === getAdminEmail();
  } catch {
    return false;
  }
}
