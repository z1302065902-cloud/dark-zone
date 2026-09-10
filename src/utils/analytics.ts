/**
 * Lightweight, privacy-safe analytics.
 * Events are counted in localStorage ONLY — nothing is sent off-device,
 * no cookies, no third-party trackers. A simple "last events" log helps
 * the developer understand session flow when users report issues.
 */

const KEY = 'dz_analytics';
const MAX_EVENTS = 200;

interface DZEvent {
  ts: number;
  ev: string;
  [k: string]: unknown;
}

/** Record an event (fire-and-forget, never throws). */
export const track = (ev: string, data: Record<string, unknown> = {}): void => {
  try {
    const raw = localStorage.getItem(KEY);
    const list: DZEvent[] = raw ? (JSON.parse(raw) as DZEvent[]) : [];
    list.push({ ts: Date.now(), ev, ...data });
    while (list.length > MAX_EVENTS) list.shift();
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage unavailable */ }
};

/** Read the stored event log (for diagnostics). */
export const getEvents = (): DZEvent[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DZEvent[]) : [];
  } catch {
    return [];
  }
};
