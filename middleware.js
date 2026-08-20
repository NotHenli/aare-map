// Vercel Edge Middleware – protects /admin.html and /admin with JWT session check.
// Runs on Vercel's Edge Runtime (V8 isolates) – uses Web Crypto API, no npm deps.

export const config = {
  matcher: ['/admin.html', '/admin'],
};

export default async function middleware(request) {
  const cookie = request.headers.get('cookie') || '';
  const token = parseCookie(cookie, 'admin_session');

  if (token && (await verifyJWT(token))) {
    // Valid session – allow through
    return undefined; // pass-through (NextResponse.next() equivalent)
  }

  // No valid session – redirect to login
  const loginUrl = new URL('/login.html', request.url);
  return Response.redirect(loginUrl, 302);
}

// --- Minimal JWT verification using Web Crypto API ---

function parseCookie(cookieHeader, name) {
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? match[1] : null;
}

async function verifyJWT(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify HMAC-SHA256 signature
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlDecode(signatureB64);

    const valid = await crypto.subtle.verify('HMAC', key, signature, data);
    if (!valid) return false;

    // Check expiry
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Date.now() / 1000 > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
