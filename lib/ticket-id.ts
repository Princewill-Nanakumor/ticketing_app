import { randomInt } from "node:crypto";

const TICKET_ID_LETTERS = 2;
const TICKET_ID_DIGITS = 7;
const TICKET_ID_PATTERN = /^[A-Z]{2}\d{7}$/;

export function isTicketId(value: string) {
  return TICKET_ID_PATTERN.test(value);
}

function randomLetters(count: number) {
  let result = "";

  for (let i = 0; i < count; i += 1) {
    result += String.fromCharCode(65 + randomInt(0, 26));
  }

  return result;
}

/** Examples: SB4826323, AU4729344, AI4729344 */
export function generateTicketId() {
  const prefix = randomLetters(TICKET_ID_LETTERS);
  const max = 10 ** TICKET_ID_DIGITS;
  const number = randomInt(0, max).toString().padStart(TICKET_ID_DIGITS, "0");
  return `${prefix}${number}`;
}
