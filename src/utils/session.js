/**
 * Customer-session helpers shared between the QR landing page and the
 * session shell. Kept out of component files so fast refresh stays intact.
 */

const sessionKey = (qrToken) => `menupilot.session.${qrToken}`;

/** Builds the public URL a customer lands on after scanning (FR-07, FR-11). */
export function tableQrUrl(qrToken) {
  return `${window.location.origin}/t/${qrToken}`;
}

/** Last session code opened on this device for a given table. */
export function getStoredSession(qrToken) {
  try {
    return localStorage.getItem(sessionKey(qrToken));
  } catch {
    return null;
  }
}

export function storeSession(qrToken, code) {
  try {
    if (code) localStorage.setItem(sessionKey(qrToken), code);
    else localStorage.removeItem(sessionKey(qrToken));
  } catch {
    /* storage unavailable */
  }
}
