/**
 * Monetization: Demo vs Full-version gating.
 *
 * Full version when ANY of these is true:
 *   - URL has ?full=1
 *   - URL has ?debug=1            (test/debug bridge — keeps E2E on the full chain)
 *   - a valid license code was redeemed (localStorage `dz_license`)
 *   - page is opened from a local file (offline ZIP bundle from 爱发电 etc.)
 *
 * Everything else (public free hosting: itch/GitHub Pages) runs in DEMO mode,
 * gated after the 4th objective (restore_power) by UnlockOverlay.
 */

const LICENSE_KEY = 'dz_license';

/** FNV-1a 32-bit — compact sync hash used to validate license codes. */
const fnv1a = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
};

/** Redeemable license codes → expected FNV of 'dz:' + code. */
const VALID_CODES = new Set<number>([
  965336101, // DZ-8K2P-9QXW-4M7C
  2212401101, // DZ-1A1B-2C2D-3E3F
]);

const isFileProtocol = (): boolean =>
  typeof window !== 'undefined' && window.location.protocol === 'file:';

const hasUrlFlag = (flag: string): boolean => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has(flag);
};

const storedLicenseValid = (): boolean => {
  try {
    const raw = localStorage.getItem(LICENSE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { code?: string; valid?: boolean };
    return parsed.valid === true && typeof parsed.code === 'string' && isLicenseValid(parsed.code);
  } catch {
    return false;
  }
};

/** Is this a full (unlocked) build? */
export const isFullVersion = (): boolean =>
  isFileProtocol() || hasUrlFlag('full') || hasUrlFlag('debug') || storedLicenseValid();

/** Is this a demo build (public free hosting)? */
export const isDemoMode = (): boolean => !isFullVersion();

/** Validate a license code (DZ-XXXX-XXXX-XXXX). */
export const isLicenseValid = (code: string): boolean => {
  const clean = code.trim().toUpperCase();
  if (!/^DZ-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(clean)) return false;
  return VALID_CODES.has(fnv1a('dz:' + clean));
};

/** Redeem a license code; returns true on success. */
export const redeemLicense = (code: string): boolean => {
  if (!isLicenseValid(code)) return false;
  try {
    localStorage.setItem(LICENSE_KEY, JSON.stringify({ code: code.trim().toUpperCase(), valid: true }));
  } catch { /* storage unavailable */ }
  return true;
};

/** Remove the redeemed license (e.g. from the settings menu). */
export const clearLicense = (): void => {
  try { localStorage.removeItem(LICENSE_KEY); } catch { /* noop */ }
};
