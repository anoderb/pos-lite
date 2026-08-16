# PLAN — Tokiva POS Lite Deep Audit

**Target:** https://pos-lite-delta.vercel.app/ + https://api.tokiva.biz.id/api
**Tanggal:** 2026-08-14
**Tester:** Zye
**Mode:** Owner-authorized black-box security, bug bounty, QA/QC
**Batas:** No DoS, no brute-force, no destructive production action. Test records created during scan were scoped to QA data; cleanup attempted. Auth rate limiting blocked final cleanup verification.

## Objectives
- Map FE/API/admin attack surface.
- Verify authentication, authorization, tenant isolation, role boundaries.
- Test IDOR, validation, business logic, XSS, SSRF, error disclosure, rate limiting, cache/CORS.
- Separate confirmed findings from hypotheses and informational observations.
- Run Stage 7 review gate before delivery.

## Test Phases

### A. Surface mapping — DONE
- API banner, health, docs exposure.
- FE routes and JavaScript chunks.
- API namespaces, HTTP methods, Indonesian verb variants.
- Admin endpoint surface.
- CORS, security headers, cache behavior, source-map availability.

### B. Auth/session — DONE
- Login error consistency and email oracle.
- Role boundary: owner, kasir, admin.
- Logout invalidation behavior.
- Refresh-token body/cookie behavior.
- JWT malformed/alg:none rejection.
- CORS credential behavior.

### C. Tenant isolation / IDOR — DONE
- Dual-account owner test.
- `toko_id` query override.
- Cross-tenant create/read/mutate.
- Cross-tenant detail IDs.
- Cross-tenant list scoping.

### D. Input/business logic — DONE
- Invalid UUID, path normalization, wrong methods.
- Pagination and query pollution.
- Empty/malformed bodies and content types.
- Numeric boundaries, negative stock/price/cash.
- Stored XSS/SSTI payload matrix.
- SSRF URL differential.
- Transaction/shift validation.

### E. Report gate — DONE
- Confirmed vs suspected labels.
- No invented impact.
- CVSS/CWE included.
- Remediation supplied.
- Test artifacts and cleanup status documented.

## Initial Risk Hypotheses
1. Tenant ID trusted from query/body.
2. User-generated strings rendered without output encoding.
3. Logout only client-side / token remains accepted.
4. Admin and owner token confusion.
5. URL fields trigger backend fetch.
6. Invalid database input bubbles to 500.
7. Collections ignore pagination.
8. Public API metadata leaks internal docs location.

## Deliverables
- `PLAN.md` — scope and method.
- `REPORT.md` — confirmed findings, severity, evidence, review decisions.
- `SOLUSI.md` — prioritized fixes and verification tests.

## Safety / Cleanup
- Avoided brute force and destructive deletes outside QA-created records.
- Restored main store values after SSRF/XSS mutation tests.
- One QA shift opened and closed with `kas_aktual=0` after negative-value rejection test.
- Auth rate limit later returned HTTP 500, blocking final authenticated cleanup verification. Recheck QA-created payload rows before production release.

## Stage 7 Summary
- READY TO FIX: F01, F02, F03, F04, F05, F06, F07, F08, F09.
- NEED MORE EVIDENCE: suspected source-map exposure, SSRF internal reachability, exact FE XSS execution sink.
- CREDIT: JWT alg:none rejection, owner/kasir route guards, CORS origin allowlist, negative kas_aktual rejection, mass assignment role defaulting.

## Next Action
Fix F01–F04 first, deploy, then rerun dual-account regression matrix.
2. TEST MATRIX

| Area | Expected secure behavior | Actual probe |
|---|---|---|
| Owner A/B tenant | B cannot read/write A | F01 confirmed write/create override |
| Logout | old access token rejected | F02 old token still accepted |
| User fields | tags encoded/rejected | F03/F04/F05 stored |
| Invalid UUID | 400/404 | F06 500 |
| Collections | limit enforced | F07 ignored |
| URL fields | HTTPS public only, no fetch internal | F08 500 differential |
| Error handling | 400/404/405 | F09 500 |
| API metadata | no internal topology | F10 localhost docs URL |
| Role boundary | kasir cannot owner | pass |
| JWT alg | forged token rejected | pass |

## Scope Note
No source repository was provided. Static findings are limited to public FE JavaScript and HTTP behavior; server source/dependency CVE audit requires backend repository or deployment artifact.

## 3. REVIEW GATE

Each report item includes: reproducibility status, impact, root cause hypothesis, scope, severity, confidence, and rejection risk. Items without end-to-end impact are marked `NEED MORE EVIDENCE`, not overstated.

## 4. DELIVERY

Reports saved under `/home/ubuntu/audits/pos-lite-deep-2026-08-14/` and sent to Telegram after file existence verification.

## 5. POST-FIX REGRESSION

Run all original requests after deployment. Expected: F01 → 403/404, F02 → 401, F03/F04/F05 → encoded/rejected, F06 → 400/404, F07 → <= limit, F08 → 400 without server fetch, F09 → correct status, F10 → sanitized banner or removed.

## 6. AUDIT LOG

- Live target reachable.
- Credentials used only for authorized owner QA.
- No secrets included in report; access tokens/redacted.
- Rate-limit responses observed; no intentional bypass attempted.
- Final report does not claim findings that could not be proven.

## 7. SIGN-OFF

Status: `DEEP SCAN COMPLETE — FIX REQUIRED`

Primary blocker: F01 cross-tenant authorization.
Secondary blocker: F02 logout/session revocation.
XSS cluster: F03–F05.

---

*Generated from live probes and FE bundle inspection. Date-sensitive values must be rechecked after deployment.*

## 8. PHASE DETAIL

### Endpoint inventory observed
- `/api/auth/*`: login, register, profil, logout, ganti-password, lupa-password, refresh.
- `/api/owner/*`: toko, pengguna, produk, supplier, satuan, kategori, shift.
- `/api/kasir/*`: transaksi, shift/buka, shift/tutup.
- `/api/admin/*`: auth/login, auth/me, dashboard, users, data-collector, kurasi, model.

### FE routes observed
- `/login`, `/owner/dashboard`, `/owner/produk`, `/owner/pengaturan`, `/owner/pos`.
- `/admin/login`, `/admin/dashboard`, `/admin/users`, `/admin/data-collector`, `/admin/kurasi`, `/admin/model`, `/admin/log`.

### Not tested
- File upload path because no authenticated upload route was exposed in public JS.
- Payment webhook because no Midtrans/Xendit route exposed.
- Backend npm/pip dependency scan because source repo unavailable.
- Database RLS direct test because anon key not exposed in client bundle.

### Quality standard
Only live status/body/header evidence or bundle evidence is used. Historical audit evidence is labeled historical and not silently promoted to new confirmation.

### Re-test requirement
Any fix claim needs 5 repetitions where practical, two accounts for tenant checks, and a fresh login after deployment.

### Final state
Findings are ready for remediation tracking, not automatic public disclosure or auto-submit.

---

END PLAN
