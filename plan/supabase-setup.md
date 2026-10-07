# Supabase setup (Questra)

Questra uses Supabase for two things:

- **Auth** — email + password accounts, verified with a 6-digit OTP emailed to the user.
- **Database (Postgres)** — the `query_usage` table that backs the free-query quota.

Everything the backend needs lives in `backend/.env`. The frontend only ever gets the
**anon** key (public by design); the **service-role** key stays on the server.

---

## 1. Create the project

1. Go to https://supabase.com and create a project.
2. Wait for provisioning, then open **Project Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (secret — backend only)

Put them in `backend/.env`, and the URL + anon key in `frontend/.env.local`:

```
# backend/.env
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANONYMOUS_FREE_QUERIES=2
QUOTA_WINDOW_HOURS=24
```

```
# frontend/.env.local
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 2. Enable email + OTP confirmation

1. **Authentication → Providers → Email**: enable it and turn on **Confirm email**.
2. **Authentication → Email Templates → Confirm signup**: include the OTP token so the email
   carries a 6-digit code the user can type back:

   ```
   Your Questra verification code is {{ .Token }}
   ```

   (`{{ .Token }}` renders the numeric OTP; `{{ .ConfirmationURL }}` would be a magic link.)

## 3. Configure custom SMTP

Supabase's built-in mailer is heavily rate-limited, so set up your own SMTP:

1. **Project Settings → Auth → SMTP Settings**: enable **Custom SMTP** and enter your
   provider's host, port, user, password, and a **Sender email** you control.
2. Save, then send a test to confirm delivery.

Providers that work well: Resend, SendGrid, Mailgun, Postmark, or a Gmail app password.
Until SMTP is configured, signup still creates the user but the OTP email may not arrive.

## 4. Create the quota table

Open **SQL → New query**, paste `backend/supabase/schema.sql`, and run it. It creates
`public.query_usage`, an index, and enables RLS with no public policies (only the
service-role backend can read/write it).

## 5. Verify

With keys in place:

```bash
cd backend
.venv\Scripts\python -m pytest tests/ -v      # mocked — no keys required
.venv\Scripts\python -m uvicorn app:app --port 8000
```

Then in the app: make 2 anonymous suggestion requests (they succeed), and the 3rd returns
`429 QUOTA_EXCEEDED` and opens the login popup. Sign up with a real address, enter the OTP
from the email, and suggestions are unlimited afterwards.

## How the quota is keyed

| Caller | Subject key | Limit |
|--------|-------------|-------|
| Signed in | `user:<uuid>` | unlimited |
| Anonymous with `X-Anon-Id` | `anon:<id>` | `ANONYMOUS_FREE_QUERIES` |
| Anonymous without it | `ip:<addr>` | `ANONYMOUS_FREE_QUERIES` |

Usage is counted within `QUOTA_WINDOW_HOURS` (default 24; set to `0` for an all-time cap).
If Supabase is unconfigured — or `public.query_usage` is missing — the quota runs unmetered (with a
warning logged) rather than blocking requests, so create the table to enforce the limit.
