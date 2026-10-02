/* Shared email + phone validators used by the auth and profile forms.
   The same rules are enforced server-side in auth.service.ts. */

/** RFC-style email check: single @, sane local part, dotted domain, alpha TLD. */
export function isValidEmail(raw: string): boolean {
  const email = raw.trim();
  if (!email || email.length > 254) return false;
  const at = email.indexOf("@");
  if (at <= 0 || at !== email.lastIndexOf("@") || at === email.length - 1) return false;

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return false;
  }
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
  if (!domain || domain.length > 253 || !domain.includes(".")) return false;

  const labels = domain.split(".");
  const tld = labels[labels.length - 1];
  return (
    labels.every((label) => /^[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) &&
    /^[A-Za-z]{2,}$/.test(tld)
  );
}

/**
 * Rwandan phone numbers: 0788123456 / +250788123456 / 250788123456,
 * tolerant of spaces, dashes, dots and parentheses. Mobile prefixes
 * 072 / 073 / 078 / 079.
 */
export function isValidPhone(raw: string): boolean {
  const compact = raw.replace(/[\s().-]/g, "");
  return /^(?:\+?250|0)?7[2389]\d{7}$/.test(compact);
}

/** Canonical form stored in the DB: +250 followed by 9 digits. */
export function normalizePhone(raw: string): string | null {
  const compact = raw.replace(/[\s().-]/g, "");
  const match = compact.match(/^(?:\+?250|0)(7[2389]\d{7})$/);
  return match ? `+250${match[1]}` : null;
}

/** Validation message for an email field — null when acceptable. */
export function emailError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Email address is required.";
  if (!isValidEmail(value)) {
    return "Enter a valid email address, e.g. name@example.com.";
  }
  return null;
}

/** Validation message for a phone field — null when acceptable. */
export function phoneError(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Phone number is required.";
  if (!isValidPhone(value)) {
    return "Enter a valid Rwandan phone number, e.g. 0788123456 or +250788123456.";
  }
  return null;
}
