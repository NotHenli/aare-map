// Vercel Serverless Function – POST /api/auth/login
// Verifies admin password + TOTP 6-digit code, returns a signed JWT session cookie.

const { authenticator } = require('otplib');
const { SignJWT } = require('jose');

module.exports = async function handler(req, res) {
  // Only POST allowed
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, code } = req.body || {};

  if (!password || !code) {
    return res.status(400).json({ error: 'Password and code are required.' });
  }

  // --- Verify password (constant-time comparison) ---
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword || !timingSafeEqual(password, adminPassword)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // --- Verify TOTP code ---
  const totpSecret = process.env.ADMIN_TOTP_SECRET;
  if (!totpSecret) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  // Allow a 1-step window (±30s) to account for clock drift
  authenticator.options = { window: 1 };
  const isValid = authenticator.check(code, totpSecret);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // --- Issue JWT session cookie ---
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return res.status(500).json({ error: 'Server not configured.' });
  }

  const secret = new TextEncoder().encode(authSecret);
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret);

  // Set HttpOnly, Secure cookie (24h max-age)
  const isLocal = req.headers.host && req.headers.host.includes('localhost');
  const cookieFlags = [
    `admin_session=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${60 * 60 * 24}`,
  ];
  if (!isLocal) cookieFlags.push('Secure');

  res.setHeader('Set-Cookie', cookieFlags.join('; '));
  return res.status(200).json({ ok: true });
};

// Constant-time string comparison to prevent timing attacks
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const lenA = Buffer.byteLength(a);
  const lenB = Buffer.byteLength(b);
  const bufA = Buffer.alloc(Math.max(lenA, lenB));
  const bufB = Buffer.alloc(Math.max(lenA, lenB));
  Buffer.from(a).copy(bufA);
  Buffer.from(b).copy(bufB);
  // crypto.timingSafeEqual requires same length, which we've ensured
  const crypto = require('crypto');
  return lenA === lenB && crypto.timingSafeEqual(bufA, bufB);
}
