import { cookies } from "next/headers";
import { FLASH_COOKIE, type FlashMessage } from "@/lib/flash-shared";

export async function setFlash(message: FlashMessage) {
  const cookieStore = await cookies();
  cookieStore.set(FLASH_COOKIE, message, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });
}
