import { randomInt } from "node:crypto";

const TICKET_ID_PREFIX = "SB";
const TICKET_ID_DIGITS = 7;
const TICKET_ID_PATTERN = /^SB\d{7}$/;

export function isTicketId(value: string) {
  return TICKET_ID_PATTERN.test(value);
}

/** Example: SB4826323 */
export function generateTicketId() {
  const max = 10 ** TICKET_ID_DIGITS;
  const number = randomInt(0, max).toString().padStart(TICKET_ID_DIGITS, "0");
  return `${TICKET_ID_PREFIX}${number}`;
}
