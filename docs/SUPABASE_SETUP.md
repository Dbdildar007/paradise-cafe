# Supabase backend - setup & reference

## Architecture
```
App --(1) phone+device--> Edge Function  otp-guard --> check_and_log_otp_request()   (rate limit, hashed)
App --(2) Firebase sends SMS, app verifies OTP (Firebase Auth)
App --(3) Firebase ID token--> Edge Function auth-sync --> verify JWT --> upsert_profile_on_login()
                                                                     --> profiles / user_devices / audit log
App --(4) later: supabase-js with accessToken = Firebase ID token --> RLS (auth.jwt()->>'sub' = firebase_uid)
```
The service-role key lives ONLY inside Edge Functions. The app holds just the public anon key.

## One-time setup
```bash
npm i -g supabase            # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <PROJECT_REF>

# 1. Tell Supabase to trust Firebase tokens: edit supabase/config.toml
#    [auth.third_party.firebase] enabled = true / project_id = "<FIREBASE_PROJECT_ID>"
#    (also enable it in Dashboard -> Authentication -> Sign In / Providers -> Third-party -> Firebase)

# 2. Create the schema
supabase db push                      # applies supabase/migrations/*.sql
#   local dev instead:  supabase start && supabase db reset   (also loads supabase/seed.sql)

# 3. Secrets used by the Edge Functions
supabase secrets set FIREBASE_PROJECT_ID=<FIREBASE_PROJECT_ID> OTP_HASH_PEPPER=$(openssl rand -hex 32)

# 4. Deploy the functions
supabase functions deploy otp-guard --no-verify-jwt
supabase functions deploy auth-sync --no-verify-jwt
```
Then put the project URL and anon key in `src/config/api.ts` (`functionsBaseUrl = https://<ref>.supabase.co/functions/v1`).

## Smoke test
```bash
curl -s -X POST https://<ref>.supabase.co/functions/v1/otp-guard \
  -H "Content-Type: application/json" -d '{"phone":"+919876543210","deviceId":"test-device-0001"}'
# -> {"allowed":true,"retryAfterSec":0}     (a second call within 55 s -> allowed:false)
```

## Tables (all in `public`, RLS enabled)
| Table | Purpose |
|---|---|
| `profiles` | Customer profile: phone, name, email, DOB, gender, language, loyalty tier/points, referral code, status |
| `user_devices` | Devices per customer (platform, app/OS version, push token, last seen) |
| `addresses` | Delivery addresses, one default per customer |
| `outlets`, `menu_categories`, `menu_items` | Catalogue (public read) |
| `orders`, `order_items`, `order_status_history`, `payments` | Orders (money in paise), items with price snapshots, audit trail, payments |
| `ratings` | One rating per delivered order; keeps `outlets.rating_avg/count` current |
| `coupons`, `coupon_redemptions` | Offers and usage |
| `loyalty_ledger` | Points history (profile points are a cache of it) |
| `favorite_outlets`, `favorite_items`, `notifications` | Customer extras |
| `otp_request_log`, `auth_audit_log` | Internal, service-role only |

## Security model
- RLS **enabled and forced** on sensitive tables; customers only see their own rows; internal tables have no policies.
- Identity columns, status and loyalty cannot be edited by customers (column grants + trigger).
- Orders can only be inserted as `placed/pending`; status changes happen via server functions (`cancel_my_order`).
- All `SECURITY DEFINER` functions pin `search_path`; service-only functions are granted to `service_role` only.
- Phone numbers are never stored in the OTP log (HMAC with a server pepper).

## Verified by tests (`npm run test:backend`)
53 database assertions against a real PostgreSQL (new vs returning user, relink, suspension, RLS isolation, protected columns,
order/rating rules, OTP guard limits, deletion) + 29 Deno tests for the Edge Functions (JWT verification incl. wrong audience/issuer/
expired/alg=none, input validation, fail-closed behaviour, no info leaks).

## Operations
- Schedule `select public.purge_otp_request_log();` daily with pg_cron (see comment in the migration).
- Enable PITR backups, log drains and alerts on 5xx from the functions.
- Rotate `OTP_HASH_PEPPER` only with a retention plan (it resets rate-limit history).
