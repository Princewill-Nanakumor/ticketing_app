/** Only this email is granted ADMIN on registration. Everyone else is USER. */
export const ADMIN_EMAIL = "daviddillion272@gmail.com";

export function isAdminEmail(email: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}
