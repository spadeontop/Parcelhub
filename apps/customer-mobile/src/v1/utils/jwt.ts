const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function decodeBase64UrlToUtf8(input: string): string | null {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      if (typeof TextDecoder !== 'undefined') {
        return new TextDecoder().decode(bytes);
      }
      return binary;
    }

    // Pure-JS fallback if atob is unavailable
    let output = '';
    for (let i = 0; i < padded.length; i += 4) {
      const c1 = BASE64_CHARS.indexOf(padded[i]);
      const c2 = BASE64_CHARS.indexOf(padded[i + 1]);
      const c3 = padded[i + 2] === '=' ? -1 : BASE64_CHARS.indexOf(padded[i + 2]);
      const c4 = padded[i + 3] === '=' ? -1 : BASE64_CHARS.indexOf(padded[i + 3]);

      if (c1 < 0 || c2 < 0) return null;
      output += String.fromCharCode((c1 << 2) | (c2 >> 4));
      if (c3 >= 0) {
        output += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
      }
      if (c4 >= 0) {
        output += String.fromCharCode(((c3 & 3) << 6) | c4);
      }
    }
    return output;
  } catch {
    return null;
  }
}

/**
 * Checks whether a JWT is expired (or malformed) using its `exp` claim.
 * Applies a small clock-skew buffer so near-expired tokens are treated as expired.
 */
export function isJwtExpired(token: string | null | undefined, skewSeconds: number = 30): boolean {
  if (!token || typeof token !== 'string') {
    return true;
  }

  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return true;
  }

  const decoded = decodeBase64UrlToUtf8(parts[1]);
  if (!decoded) {
    return true;
  }

  try {
    const payload = JSON.parse(decoded) as { exp?: unknown };
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return true;
    }
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}
