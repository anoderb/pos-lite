# SOLUSI — Tokiva POS Lite Deep Audit

**Prioritas:** F01 → F02 → F03/F04/F05 → F06/F07/F09 → F08/F11/F12 → F10/F13/F14/F16/F18.

## F01 — Tenant authorization

```ts
// Never accept toko_id from query/body.
const tenantId = req.user.toko_id;

const { data, error } = await supabase
  .from('supplier')
  .select('*')
  .eq('toko_id', tenantId)
  .eq('id', resourceId)
  .maybeSingle();

if (error) throw new InternalServerErrorException();
if (!data) throw new NotFoundException('Resource tidak ditemukan');
```

Apply to every owner/kasir read/write/delete. Strip `toko_id` from DTOs or reject it with 400. Add database RLS/ownership predicates.

```ts
// Test requirement:
expect(await requestAsB.get(`/owner/supplier/${supplierA}`)).toMatchObject({status: 404});
expect(await requestAsB.put(`/owner/toko?toko_id=${tokoA}`)).toMatchObject({status: 403});
expect(await requestAsB.post(`/owner/pengguna?toko_id=${tokoA}`)).toMatchObject({status: 403});
```

## F02 — Logout session revocation

```ts
@Post('logout')
@UseGuards(AuthGuard)
async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
  await supabase.auth.admin.signOut(req.user.sub);
  res.clearCookie('refresh_token', { httpOnly: true, secure: true, sameSite: 'strict', path: '/' });
  return { berhasil: true, pesan: 'Logout berhasil' };
}
```

For immediate access-token revocation:
- Keep `session_id` / token version server-side.
- Deny revoked sessions until `exp`.
- Access JWT TTL 5–15 minutes.
- Rotate refresh tokens on every refresh.
- Verify old access token becomes rejected after logout.

## F03/F04/F05 — Central plain-text sanitizer and safe rendering

```ts
export function sanitizePlainText(value: unknown): string {
  if (typeof value !== 'string') throw new BadRequestException('Nilai harus berupa teks');
  return value
    .normalize('NFKC')
    .replace(/[<>]/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on[a-z]+\s*=/gi, '')
    .replace(/[{}]/g, '')
    .trim()
    .slice(0, 255);
}
```

Use for `info_rekening`, supplier/category/unit/product/customer names, notes, addresses. Better: use a vetted sanitizer package with `allowedTags: []` and encode output. React text nodes are safe; never use `dangerouslySetInnerHTML` for DB values.

Clean existing rows with a controlled migration. Re-test `<img>`, `<svg>`, event attributes, `javascript:`, template delimiters, Unicode normalization variants.

## F06 — UUID and exception mapping

```ts
import { ParseUUIDPipe } from '@nestjs/common';

@Get(':id')
get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
  return this.service.getScoped(id);
}
```

Global exception policy:

```ts
if (isInvalidUuid(error)) return res.status(400).send({berhasil:false,pesan:'ID tidak valid'});
if (isNotFound(error)) return res.status(404).send({berhasil:false,pesan:'Data tidak ditemukan'});
return res.status(500).send({berhasil:false,pesan:'Terjadi kesalahan internal pada server'});
```

Reject ambiguous normalized paths at reverse proxy; use canonical route matching.

## F07 — Enforced pagination

```ts
function pagination(rawLimit: unknown, rawOffset: unknown) {
  const limit = Math.min(Math.max(Number.parseInt(String(rawLimit ?? 20), 10) || 20, 1), 100);
  const offset = Math.max(Number.parseInt(String(rawOffset ?? 0), 10) || 0, 0);
  return { limit, offset };
}

const { limit, offset } = pagination(query.limit, query.offset);
const { data, count, error } = await supabase
  .from('produk')
  .select('*', { count: 'exact' })
  .eq('toko_id', req.user.toko_id)
  .range(offset, offset + limit - 1);
```

Return `{data, pagination:{limit,offset,total,has_next}}`. Reject `limit > 100` or clamp consistently.

## F08 — SSRF hardening

```ts
import dns from 'node:dns/promises';
import net from 'node:net';

const blocked = (ip: string) => {
  if (net.isIP(ip) === 4) {
    const [a,b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 169 && b === 254 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31;
  }
  return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80');
};

export async function validatePublicHttps(raw: string) {
  const u = new URL(raw);
  if (u.protocol !== 'https:') throw new BadRequestException('URL harus HTTPS');
  const addresses = await dns.lookup(u.hostname, { all: true });
  if (addresses.some(x => blocked(x.address))) throw new BadRequestException('URL internal ditolak');
  return u.toString();
}
```

Best fix: do not fetch arbitrary URLs. Upload QR/logo into controlled storage and store object key. If server fetch is mandatory: no redirects, timeout, response-size cap, MIME allowlist, egress firewall, re-resolve every redirect.

## F09 — Validation and wrong-method status

- Explicit DTO schemas for every body.
- `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
- Invalid method → 405 or 404, never 500.
- Numeric fields: finite integer/decimal, bounds, non-negative where required.
- Transaction: verify `subtotal`, `diskon_total`, `total`, item prices, stock, payment method server-side.

## F10/F18 — Remove production metadata

```ts
if (process.env.NODE_ENV === 'production') {
  return { berhasil: true, pesan: 'Tokiva API aktif' };
}
return { versi, namespaces, docs_url };
```

Do not return `http://localhost:5000/docs` publicly. Put docs behind admin VPN/auth.

## F11 — Refresh token cookie

```ts
res.cookie('refresh_token', session.refresh_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

return res.json({
  access_token: session.access_token,
  expires_at: session.expires_at,
  token_type: session.token_type,
});
```

Remove refresh token from all logs, error payloads, client state, and analytics.

## F12 — Auth throttling

- Per-IP + per-account/email key.
- Login: 5/min then 429.
- Forgot password: 3/15min per email + IP.
- Register: 5/hour per IP.
- Return `Retry-After`; never convert rate limit to 500.
- Generic reset response and email delivery queue.

## F13 — Enumeration resistance

Use same status/body for duplicate/unknown register and reset. Normalize timing with queue. Avoid explicit `Email sudah terdaftar`.

## F14 — PII minimization

Return only required fields:

```json
{"kasir":{"id":"...","nama":"..."}}
```

Keep email behind explicit owner permission or separate endpoint. Document retention and access policy.

## F15 — Password policy

- Max 72 UTF-8 bytes if bcrypt.
- Minimum length 12.
- Reject common passwords.
- Use Argon2id if migrating.
- Test Unicode and byte-length boundary.

## F16 — Duplicate business keys

Use tenant-scoped unique indexes where business rules require:

```sql
create unique index concurrently supplier_toko_nama_uq
on supplier (toko_id, lower(trim(nama)))
where aktif = true;
```

Handle constraint conflict as 409, not 500.

## F17 — Source maps

Disable production source maps or upload privately to Sentry. Verify `.map` returns 404/403 and no source content is embedded in public chunks.

## Regression commands

```bash
# Tenant isolation
curl -i "$API/owner/toko?toko_id=$TOKO_A" -H "Authorization: Bearer $TOKEN_B"
# Expected: 403/404

# Logout revocation
curl -i -X POST "$API/auth/logout" -H "Authorization: Bearer $TOKEN"
curl -i "$API/auth/profil" -H "Authorization: Bearer $TOKEN"
# Expected after revocation: 401

# XSS
curl -i -X POST "$API/owner/kategori" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"nama":"<img src=x onerror=alert(1)>"}'
# Expected: 400 or encoded plain text

# Pagination
curl -s "$API/owner/produk?limit=1&offset=0" -H "Authorization: Bearer $TOKEN"
# Expected: data length <= 1

# Invalid ID
curl -i "$API/owner/produk/not-a-uuid" -H "Authorization: Bearer $TOKEN"
# Expected: 400/404, never 500
```

## Fix Order

1. F01 tenant authorization.
2. F02 session revocation + F11 refresh cookie.
3. F03/F04/F05 XSS cluster + clean existing rows.
4. F06/F09 global validation/error handling.
5. F07 pagination.
6. F08 URL/SSRF hardening.
7. F12/F13 auth abuse controls.
8. F10/F14/F16/F18 hygiene and data minimization.

## Acceptance Criteria

- All F01–F07 and F09–F12 regression tests pass 5x.
- No cross-tenant read/write/delete succeeds.
- Old token rejected after logout or documented short TTL behavior enforced.
- No raw HTML/event handler persists in user text fields.
- Invalid input returns 4xx consistently.
- Collection limit enforced at DB layer.
- No localhost/internal docs URL in public banner.
- QA-created test data removed and verified.

---

*No public disclosure or auto-submit performed. Patches are implementation guidance; backend source review still required for exact file-level diff.*
END SOLUSI
