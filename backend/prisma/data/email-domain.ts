/** Canonical email domain for seeded accounts and UI-created users. */
export const SEED_EMAIL_DOMAIN = 'ens.com';

export function seedEmail(localPart: string): string {
  return `${localPart}@${SEED_EMAIL_DOMAIN}`;
}
