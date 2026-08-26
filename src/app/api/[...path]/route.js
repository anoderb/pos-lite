// BFF Proxy: browser → Next.js server → api.tokiva.biz.id
// JWT httpOnly cookie dikelola server-side. Network browser cuma liat tokiva.biz.id/api/*

function getApiHost() {
  const v = process.env.NEXT_PUBLIC_API_URL;
  if (!v) throw new Error('NEXT_PUBLIC_API_URL wajib di .env');
  return v.replace(/\/api$/, '');
}

export async function GET(request, { params: paramsPromise }) {
  return proxy(request, await paramsPromise, 'GET');
}
export async function POST(request, { params: paramsPromise }) {
  return proxy(request, await paramsPromise, 'POST');
}
export async function PUT(request, { params: paramsPromise }) {
  return proxy(request, await paramsPromise, 'PUT');
}
export async function PATCH(request, { params: paramsPromise }) {
  return proxy(request, await paramsPromise, 'PATCH');
}
export async function DELETE(request, { params: paramsPromise }) {
  return proxy(request, await paramsPromise, 'DELETE');
}

async function proxy(request, params, method) {
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path;
  const url = new URL(`${getApiHost()}/api/${path}${request.nextUrl.search}`);

  // Forward cookies + Authorization header
  const cookie = request.headers.get('cookie') || '';
  const authHeader = request.headers.get('authorization') || '';

  const headers = {
    cookie,
    ...(authHeader ? { authorization: authHeader } : {}),
    'Content-Type': 'application/json',
  };

  const init = { method, headers };

  if (method !== 'GET' && method !== 'HEAD') {
    const body = await request.text();
    if (body) init.body = body;
  }

  const res = await fetch(url.href, init);

  // Forward set-cookie headers back to browser
  const resHeaders = new Headers();
  resHeaders.set('content-type', res.headers.get('content-type') || 'application/json');

  // getSetCookie() modern API; fallback ke get() untuk runtime lama
  const setCookies = typeof res.headers.getSetCookie === 'function'
    ? res.headers.getSetCookie()
    : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  if (setCookies.length) {
    const cleaned = setCookies.map((c) => c.replace(/;\s*Domain\s*=[^;]+/gi, ''));
    for (const c of cleaned) resHeaders.append('set-cookie', c);
  }

  const location = res.headers.get('location');
  if (location) {
    resHeaders.set('location', location.replace(getApiHost(), request.nextUrl.origin));
  }

  const body = await res.text();
  return new Response(body, { status: res.status, headers: resHeaders });
}