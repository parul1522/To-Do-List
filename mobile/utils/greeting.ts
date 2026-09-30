export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Good evening';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string | undefined | null): string {
  return fullName?.trim().split(/\s+/)[0] ?? '';
}

export function initials(fullName: string | undefined | null): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  const letters = parts.length > 1 ? [parts[0]![0], parts[parts.length - 1]![0]] : [parts[0]?.[0]];
  return letters.filter(Boolean).join('').toUpperCase() || '?';
}
