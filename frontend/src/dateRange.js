const pad = (n) => String(n).padStart(2, '0');

// Formats a Date as local wall-clock "YYYY-MM-DDTHH:mm:ss" for <input type="datetime-local">.
export function toLocalInputValue(date) {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// Today 00:00:00 (local) to now.
export function defaultRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return { from: toLocalInputValue(start), to: toLocalInputValue(now) };
}

// A datetime-local value is parsed as local time; toISOString yields the UTC instant.
export function localInputToUtcIso(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatLocal(ms) {
  return new Date(ms).toLocaleString();
}
