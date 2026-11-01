export const formatPrice = (price: string) => `₹${Number(price).toFixed(2).replace(/\.00$/, '')}`;

// Accepts 2026-11-02 or a full timestamp. Delivery dates are calendar days, so this stays in UTC
// rather than letting the phone's time zone move them.
export const formatDate = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00.000Z`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

export const previousDay = (date: string) =>
  new Date(new Date(`${date}T00:00:00.000Z`).getTime() - 86_400_000).toISOString().slice(0, 10);

export const errorMessage = (error: unknown) =>
  error instanceof TypeError
    ? "Can't reach the server. Check your connection and try again."
    : error instanceof Error
      ? error.message
      : 'Something went wrong';
