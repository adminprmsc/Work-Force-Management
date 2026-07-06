export function getUserInitials(username?: string | null, email?: string | null): string {
  const source = (username ?? email ?? '?').trim();
  if (!source) return '?';

  const parts = source.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  const compact = source.replace(/[^a-zA-Z0-9]/g, '');
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  return (compact[0] ?? '?').toUpperCase();
}

export function formatUsername(username?: string | null): string {
  if (!username) return 'Field user';
  return username.replace(/[._]/g, ' ');
}
