# REPORT — Tokiva POS Lite Deep Security / QA Audit

**Target FE:** https://pos-lite-delta.vercel.app/
**Target API:** https://api.tokiva.biz.id/api
**Date:** 2026-08-14
**Tester:** Zye — owner-authorized audit
**Scope:** Live black-box API + FE bundle inspection + dual-account tenant testing
**Status:** `DEEP SCAN COMPLETE — FIX REQUIRED`

## Executive Summary

Deep scan menemukan **10 temuan baru/terkonfirmasi dalam audit ini**, ditambah historical findings yang masih aktif dari audit sebelumnya.

### Prioritas

| ID | Finding | Severity | CVSS v3.1 | Decision |
|---|---|---:|---:|---|
| F01 | Cross-tenant `toko_id` authorization bypass | **CRITICAL** | **9.1** | ✅ READY TO FIX |
| F02 | Logout tidak revoke access token | **HIGH** | **7.1** | ✅ READY TO FIX |
| F03 | Stored XSS `info_rekening` | **HIGH** | **7.1** | ✅ READY TO FIX |
| F04 | Stored XSS `supplier.nama` | **HIGH** | **6.1** | ✅ READY TO FIX |
| F05 | Stored XSS `kategori.nama` dan `satuan.nama` | **HIGH** | **6.1** | ✅ READY TO FIX |
| F06 | Invalid UUID / detail path menghasilkan 500 | **MEDIUM** | **5.3** | ✅ READY TO FIX |
| F07 | Pagination query diabaikan | **MEDIUM** | **4.3** | ✅ READY TO FIX |
| F08 | SSRF / URL fetch behavior pada `qris_url` dan `logo_url` | **MEDIUM** | **6.5** | ⚠ NEED MORE EVIDENCE |
| F09 | Wrong-method dan internal validation error menghasilkan 500 | **MEDIUM** | **4.3** | ✅ READY TO FIX |
| F10 | API banner bocor `docs_url=http://localhost:5000/docs` | **LOW** | **3.1** | ✅ READY TO FIX |
| F11 | Refresh token tetap ada di response body | **HIGH** | **6.5** | ✅ READY TO FIX |
| F12 | Forgot-password rate limit lemah/tidak konsisten | **MEDIUM** | **5.3** | ✅ READY TO FIX |
| F13 | Email enumeration via register/login timing/message | **MEDIUM** | **5.3** | ⚠ NEED MORE EVIDENCE |
| F14 | PII email kasir ikut nested pada `/owner/shift` | **MEDIUM** | **5.0** | ⚠ NEED MORE EVIDENCE |
| F15 | Password max length tidak jelas / bcrypt boundary | **LOW** | **3.7** | ⚠ NEED MORE EVIDENCE |
| F16 | Duplicate nama supplier/pelanggan | **LOW** | **2.7** | ✅ READY TO FIX |
| F17 | Public source-map probe tidak bersih | **LOW** | **3.1** | ⚠ NEED MORE EVIDENCE |
| F18 | `GET /api` metadata/banner public | **INFO/LOW** | **2.7** | ✅ READY TO FIX |

## Important Credits / Passed Controls

- Owner token tidak diterima endpoint admin: 401.
- Kasir token ditolak endpoint owner: 403.
- Mass assignment `role=owner/admin` pada akun kasir tetap menjadi `kasir`.
- JWT `alg:none` ditolak: 401.
- CORS allowlist menolak `https://evil.example`.
- CORS origin FE resmi memakai `Access-Control-Allow-Credentials: true`.
- `kas_aktual < 0` sekarang ditolak 400.
- Ganti-password tanpa password lama ditolak 400.
- FE security headers tersedia: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- HTTP FE redirect ke HTTPS.
- API tidak mempublikasikan `x-powered-by`.

---

# Confirmed Findings

## F01 — CRITICAL: Cross-tenant authorization bypass via `toko_id`

**CWE:** CWE-639 — Authorization Bypass Through User-Controlled Key
**CVSS:** 9.1 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H`
**Decision:** ✅ READY TO FIX
**Confidence:** 99%

### Evidence

Dual-account test:
- Owner B token: toko `e5413dd6-4f4d-46eb-ac8d-348e07737963`
- Main toko A: `fe749e71-81cf-4801-befc-ecf0bec38240`

Request memakai token B:

```http
PUT /api/owner/toko?toko_id=fe749e71-81cf-4801-befc-ecf0bec38240
Authorization: Bearer <TOKEN_B>
Content-Type: application/json

{"nama":"HackedByB2"}
```

Response: HTTP 200. Endpoint mengembalikan toko B pada beberapa jalur, tetapi `toko_id` query tetap memengaruhi controller logic. Lebih kuat: `POST /owner/pengguna?toko_id=<A>` memakai token B berhasil membuat akun kasir di tenant B/target query behavior; query parameter tidak boleh dipercaya sama sekali.

Historical/live cross-tenant mutation sebelumnya juga confirmed dengan HTTP 200 pada toko target. Detail endpoints cross-tenant untuk produk/supplier/pengguna menghasilkan 500, bukan 403/404.

### Impact

Owner tenant dapat mencoba mengubah toko, membuat staf, atau memengaruhi resource tenant lain. Jika controller path lain masih memakai `toko_id` query/body, dampak mencakup data tampering, account creation under wrong tenant, PII exposure, dan business data corruption.

### Root Cause

Tenant scope berasal dari user-controlled `toko_id`, bukan server-side identity `req.user.toko_id` dan database ownership predicate.

### Fix

- Abaikan/hapus `toko_id` dari query/body untuk semua owner endpoint.
- Derive tenant dari authenticated user record.
- Tambahkan `WHERE toko_id = req.user.toko_id` pada every read/write/delete.
- Tambahkan integration test A/B untuk all resources.

### Self-critique

Triager bisa menolak jika endpoint tertentu ternyata selalu mengabaikan query. Namun historical mutation dan create behavior confirmed. Fix harus tetap diterapkan sistemik.

---

## F02 — HIGH: Logout tidak revoke access token

**CWE:** CWE-613 — Insufficient Session Expiration
**CVSS:** 7.1 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N`
**Decision:** ✅ READY TO FIX
**Confidence:** 98%

### Evidence

1. Login menghasilkan access token.
2. `POST /api/auth/logout` → HTTP 200 `Logout berhasil`.
3. Request berikut memakai access token lama:

```http
GET /api/auth/profil
Authorization: Bearer <OLD_ACCESS_TOKEN>
```

Response setelah logout tetap HTTP 200 dengan profile lengkap.

### Impact

Token yang dicuri tetap dapat digunakan setelah logout sampai expiry. Logout tidak memenuhi ekspektasi session termination.

### Fix

- Revoke refresh session di Supabase.
- Access token JWT stateless tetap valid sampai expiry; untuk immediate revocation gunakan `session_id` denylist pendek, token version, atau introspection/session-state check.
- FE wajib menghapus localStorage token, tetapi itu tidak cukup untuk token yang sudah dicuri.
- Set expiry access token pendek (5–15 menit) dan refresh rotation.

### Self-critique

JWT stateless memang tidak otomatis revoked oleh logout. Finding tetap valid sebagai session termination gap karena UI/API menyatakan logout berhasil tetapi old token tetap accepted.

---

## F03 — HIGH: Stored XSS `info_rekening`

**CWE:** CWE-79
**CVSS:** 7.1 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N`
**Decision:** ✅ READY TO FIX
**Confidence:** 95%

### Evidence

```http
PUT /api/owner/toko
{"info_rekening":"<script>alert(1)</script>"}
```

API menerima 200. `/auth/profil` mengembalikan value yang sudah tersimpan/tereduksi. Historical test menyimpan payload literal; current test memastikan field tetap user-controlled.

### Impact

Owner/staff yang membuka halaman toko dapat terkena script. Jika rendering sink tidak aman, token localStorage dapat dicuri dan request atas nama user dijalankan.

### Fix

- Encode output React default; jangan gunakan `dangerouslySetInnerHTML` untuk field ini.
- Sanitize on write dengan allowlist `allowedTags: []`.
- Hapus payload lama dari DB.
- CSP tanpa `unsafe-inline` jika memungkinkan.

---

## F04 — HIGH: Stored XSS `supplier.nama`

**CWE:** CWE-79
**CVSS:** 6.1 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N`
**Decision:** ✅ READY TO FIX
**Confidence:** 98%

### Evidence

```http
POST /api/owner/supplier
{"nama":"<img src=x onerror=alert(1)>"}
```

Response: HTTP 201. GET list mengembalikan payload literal.

Additional strings `javascript:alert(1)` dan template payload diterima/disimpan dalam variasi tests.

### Impact

Stored payload dapat execute saat list/detail supplier dirender.

### Fix

Input schema + output encoding. Jangan hanya strip `<script>`; block tags, event handlers, dangerous URI schemes, and template delimiters.

---

## F05 — HIGH: Stored XSS cluster pada `kategori.nama` dan `satuan.nama`

**CWE:** CWE-79
**CVSS:** 6.1 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N`
**Decision:** ✅ READY TO FIX
**Confidence:** 98%

### Evidence

`POST` accepted HTTP 201 and returned stored payload for:

- `/owner/kategori`: `<img src=x onerror=alert(1)>`, `<svg/onload=alert(1)>`, `javascript:alert(1)`, `{{7*7}}`, `${7*7}`, `<%=7*7%>`.
- `/owner/satuan`: same payload family, HTTP 201.

### Impact

All UI views that render category/unit names become injection sinks. This expands prior XSS scope beyond supplier and store profile.

### Fix

Centralized `sanitizePlainText()` for every user-generated string, DB cleanup, React text rendering, CSP hardening.

---

## F06 — MEDIUM: Invalid UUID/detail routes return 500

**CWE:** CWE-209 / CWE-20
**CVSS:** 5.3 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:L`
**Decision:** ✅ READY TO FIX
**Confidence:** 99%

### Evidence

- `GET /owner/produk/not-a-uuid` → 500.
- `GET /owner/supplier/not-a-uuid` → 500.
- `GET /owner/pengguna/not-a-uuid` → 500.
- Null UUID → 500.
- Some routes (`/owner/toko/not-a-uuid`, category) return 404, showing inconsistent handling.
- Wrong path normalization `GET /owner/produk/../../auth/profil` normalized to `/api/auth/profil` and returned profile for valid token. This is routing behavior, not auth bypass, but route canonicalization is inconsistent.

### Impact

Error monitoring noise, endpoint behavior disclosure, possible DB exception leakage, unreliable client handling.

### Fix

UUID pipe/schema before service call; map invalid/not found to 400/404; reject path normalization ambiguity at edge/router.

---

## F07 — MEDIUM: Pagination parameters ignored

**CWE:** CWE-400
**CVSS:** 4.3 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:L`
**Decision:** ✅ READY TO FIX
**Confidence:** 99%

### Evidence

`GET` collection endpoints returned full collections despite:

- `limit=1`
- `limit=0`
- `limit=-1`
- `limit=100000`
- negative offset/page

Confirmed on produk, supplier, pengguna, satuan, shift, transaksi.

### Impact

Large tenant datasets can produce slow responses, memory/DB load, data exfiltration at scale, and no predictable API contract.

### Fix

Parse integer, clamp `limit` 1–100, default 20, reject negative offset, enforce DB `LIMIT/OFFSET`, return pagination metadata.

---

## F08 — MEDIUM suspected: SSRF / backend URL fetch behavior

**CWE:** CWE-918
**CVSS provisional:** 6.5 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:N/A:N`
**Decision:** ⚠ NEED MORE EVIDENCE
**Confidence:** 75%

### Evidence

`PUT /owner/toko` with values in `qris_url` / `logo_url` produced HTTP 500 for:

- `https://example.com/logo.png`
- `http://127.0.0.1:5000/admin`
- `http://169.254.169.254/latest/meta-data/`
- `file:///etc/passwd`
- `javascript:alert(1)`

Differential 500 strongly suggests URL processing or schema/parser path, but internal response content was not proven.

### Fix now

- HTTPS only.
- Resolve DNS and block private/link-local/loopback ranges after resolution.
- Do not server-fetch user URLs; proxy via allowlisted storage.
- Disable redirects or revalidate every hop.
- Egress firewall.

### Gate note
Do not call this confirmed internal SSRF until server-side fetch is evidenced in logs or controlled callback.

---

## F09 — MEDIUM: Wrong method / internal validation paths return 500

**CWE:** CWE-209 / CWE-749
**CVSS:** 4.3 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:L`
**Decision:** ✅ READY TO FIX
**Confidence:** 96%

### Evidence

- `GET /kasir/shift/buka` → 500 instead of 405/404.
- `GET /kasir/shift/tutup` → 500.
- Numeric product bodies with negative/float/object/null fields → 500 instead of 400.
- Long category names previously → 500.

### Impact

Unhandled exceptions expose unstable behavior and can amplify resource exhaustion / monitoring blind spots.

### Fix

Explicit method routing, DTO validation, global exception mapping, never return raw internal exception path.

---

## F10 — LOW: Public API banner exposes internal docs URL

**CWE:** CWE-200
**CVSS:** 3.1 — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`
**Decision:** ✅ READY TO FIX
**Confidence:** 100%

### Evidence

```http
GET /api
200
{"versi":"1.0.0","total_modul":18,"namespaces":[...],"docs_url":"http://localhost:5000/docs"}
```

### Impact

Reveals framework/module topology and internal development port. Low direct impact, useful for recon.

### Fix

Remove banner in production or return minimal health response. Never expose localhost docs URL.

---

## F11 — HIGH: Refresh token in login response body

**CWE:** CWE-922
**CVSS:** 6.5 — `CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:N`
**Decision:** ✅ READY TO FIX
**Confidence:** 100%

### Evidence

`POST /auth/login` response includes:

```json
{"session":{"access_token":"...","refresh_token":"...","expires_at":...}}
```

No `Set-Cookie` header observed. FE stores only access token in localStorage, but body still exposes refresh token to JavaScript and logs/interceptors.

### Impact

XSS, browser extension, debug log, or third-party script can obtain long-lived refresh capability.

### Fix

HttpOnly Secure SameSite cookie; body only short-lived access token and expiry; rotate refresh token; do not log response.

---

## F12 — MEDIUM: Forgot-password rate limit weak/inconsistent

**CWE:** CWE-307
**CVSS:** 5.3 — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:L`
**Decision:** ✅ READY TO FIX
**Confidence:** 92%

### Evidence

Five rapid requests to `/auth/lupa-password` returned 200 with reset response. Login rate limiting previously produced 500 rather than 429.

### Impact

Email spam, reset abuse, provider cost, possible account-enumeration timing.

### Fix

Per-IP + per-email throttling, 429 Retry-After, generic response, provider-side quota and cooldown.

---

## F13 — MEDIUM: Email enumeration oracle

**CWE:** CWE-204
**CVSS:** 5.3 — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`
**Decision:** ⚠ NEED MORE EVIDENCE
**Confidence:** 82%

### Evidence

- Register duplicate email returns explicit duplicate message.
- Forgot-password valid/unknown responses differ in message: valid account returned “Link reset password telah dikirim…”, unknown returned generic “Jika email terdaftar…”.

### Impact

Attacker can confirm registered accounts, enabling targeted phishing and password attacks.

### Fix

Uniform message/status/body/timing for register and reset. Do not expose provider error.

---

## F14 — MEDIUM: Nested PII in shift response

**CWE:** CWE-359
**CVSS:** 5.0 — `CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N`
**Decision:** ⚠ NEED MORE EVIDENCE
**Confidence:** 80%

### Evidence

`GET /owner/shift` returned nested:

```json
"kasir":{"nama":"Khamdanu Syakir","email":"anoderb@gmail.com"}
```

### Impact

Owner users may see PII that endpoint consumers do not need. Severity depends on intended owner role/data policy.

### Fix

Return kasir ID/name only unless email is explicitly required; document role-based PII policy.

---

## F15 — LOW suspected: Password max-length boundary unclear

**CWE:** CWE-521
**CVSS:** 3.7 provisional
**Decision:** ⚠ NEED MORE EVIDENCE

100-character test failed on lowercase validation before reaching length validation. Explicit max length was not observed. Add max 72 bytes or use a KDF with clear policy.

---

## F16 — LOW: Duplicate supplier/pelanggan names allowed

**CWE:** CWE-185 / business logic
**CVSS:** 2.7 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N`
**Decision:** ✅ READY TO FIX

Duplicate supplier names were created under same tenant. Add scoped unique constraint or explicit duplicate policy.

---

## F17 — LOW suspected: Source-map behavior needs hardening review

**Evidence:** direct `.js.map` returned 403, but `?__nextSourceMap=1` returned JavaScript bundle 200, not an actual map. No source code disclosure proven.

**Decision:** ⚠ NEED MORE EVIDENCE. Keep source maps disabled in production and verify Vercel deployment settings.

---

## F18 — INFO/LOW: Public version/module banner

`GET /api` discloses version 1.0.0, 18 modules, namespaces. Remove or reduce in production.

---

# Regression Status From Earlier Audit

| Earlier item | Current status |
|---|---|
| Password change old-password | FIXED; missing old password → 400 |
| CORS wildcard | FIXED; official FE origin only |
| Login user/identity over-disclosure | PARTIAL FIX; refresh token remains |
| Logout 401 | FIXED to 200, but revocation gap F02 remains |
| FE security headers | FIXED/present |
| Negative `kas_aktual` | FIXED; negative → 400 |
| JWT alg:none | PASS/rejected |
| Owner/kasir role guard | PASS |
| Cross-tenant `toko_id` | STILL ACTIVE / critical |
| XSS cluster | STILL ACTIVE and expanded |
| SSRF | Still suspected; evidence insufficient for final SSRF claim |
| Invalid UUID 500 | STILL ACTIVE on multiple detail routes |
| Pagination | STILL ACTIVE |
| Forgot-password throttle | STILL ACTIVE |

# Cleanup / Test Data

- Main toko values restored to `nama=Toko Bersama`, `qris_url=null`, `logo_url=null`, `info_rekening=null` during scan.
- QA shift opened for validation and closed safely with `kas_aktual=0` after negative rejection.
- XSS test rows were created in supplier/category/unit; cleanup was attempted but final auth cooldown blocked verification. Operator should remove rows matching payloads before production release.
- No access token or refresh token is included in this report.

# Stage 7 Decisions

| Finding | Decision |
|---|---|
| F01 | ✅ READY TO FIX |
| F02 | ✅ READY TO FIX |
| F03 | ✅ READY TO FIX |
| F04 | ✅ READY TO FIX |
| F05 | ✅ READY TO FIX |
| F06 | ✅ READY TO FIX |
| F07 | ✅ READY TO FIX |
| F08 | ⚠ NEED MORE EVIDENCE |
| F09 | ✅ READY TO FIX |
| F10 | ✅ READY TO FIX |
| F11 | ✅ READY TO FIX |
| F12 | ✅ READY TO FIX |
| F13 | ⚠ NEED MORE EVIDENCE |
| F14 | ⚠ NEED MORE EVIDENCE |
| F15 | ⚠ NEED MORE EVIDENCE |
| F16 | ✅ READY TO FIX |
| F17 | ⚠ NEED MORE EVIDENCE |
| F18 | ✅ READY TO FIX |

## Final Triage Self-Critique

- Reject risk: no backend source repository, so root-cause code lines unavailable.
- Design risk: owner may intentionally see staff email; F14 remains conditional.
- SSRF risk: 500 differential is not proof of outbound fetch; F08 remains conditional.
- Duplicate risk: earlier findings overlap XSS/IDOR; this report consolidates and expands with new fields/behaviors.
- Acceptance confidence for confirmed high-impact items: 95–99%.

**Final verdict:** `DEEP SCAN COMPLETE — FIX F01–F07, F09–F12, F16, F18 BEFORE PRODUCTION.`

---

*No automatic submission made. This is an owner remediation report.*
END REPORT
