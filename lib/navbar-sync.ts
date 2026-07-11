export const NAVBAR_SYNC_EVENT = "helix:navbar-sync";

export function requestNavbarSync() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(NAVBAR_SYNC_EVENT));
}
