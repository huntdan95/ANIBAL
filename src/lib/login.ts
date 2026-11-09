// Who a sign-in request is for, when it's a staff member. Pure, so it's unit-tested.

export type StaffRow = { email: string; login_email?: string | null };

/**
 * Staff can have a separate sign-in address (staff.login_email). Typing either
 * their email or that address signs in their one account, and the link always
 * goes to the sign-in address when they have one. Rows from before that column
 * existed simply have no `login_email`.
 */
export function staffSignIn(rows: StaffRow[], typed: string): { account: string; sendTo: string } | null {
  const row = rows.find((r) => r.login_email && r.login_email === typed) ?? rows.find((r) => r.email === typed);
  return row ? { account: row.email, sendTo: row.login_email || row.email } : null;
}
