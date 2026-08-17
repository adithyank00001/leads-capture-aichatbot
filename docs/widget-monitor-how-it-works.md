# Widget install monitoring — how it actually works

This document describes **the code that exists today** in this repo (Leady AI / growscalex). It is not the old plan named `install_tracking_system`. Names, URLs, and tables below match the live implementation.

Goal in one sentence: **once a day (UTC home minute), open the paid customer’s website in a headless browser (a browser with no human) and see if `widget.js` actually ran**, then record installed / missing / technical error.

Proof of install is a **heartbeat** (a tiny POST from `widget.js` to Leady). HTML scraping in GAS is only for the Google Sheet log. Status in the database does **not** use that HTML scrape.

---

## 1. What this is not

This system does **not**:

- refund anyone
- stop chat
- create leads
- change knowledge / RAG (website text used for answers)
- edit MasterWorker or PageWorker
- run inside Google Apps Script as the daily scheduler

Google Apps Script only opens the page (via Cloudflare) and reports whether the **page opened**. Leady decides installed vs missing.

---

## 2. The pieces (who does what)

| Piece | Where | Job |
|---|---|---|
| Minute timer | Supabase `pg_cron` job `dispatch-widget-monitor-tick` (`* * * * *`) | Every minute, try to wake Leady |
| Settings row | Table `widget_monitor_settings` (exactly **one** row, `id = 1`) | Stores the URL and secret the timer uses to call Leady |
| Tick API | Next.js `POST /api/internal/widget-monitor/tick` | Claim one due customer, call GAS |
| Claim SQL | `claim_due_widget_monitor_check()` | Lock one due row, create `check_id` |
| GAS | `google-apps-script/InstallChecker.js` | Open one URL with Cloudflare Browser Rendering `/content` |
| Cloudflare | Browser Rendering API | Headless Chromium loads the customer site |
| Widget | `public/widget.js` | On load, POST heartbeat |
| Heartbeat API | `POST /api/v1/widget-heartbeat` | Record “widget ran” + match `check_id` |
| Complete API | `POST /api/internal/widget-monitor/complete` | Decide installed / missing / check_error; set next time |
| Status SQL | `schedule_widget_monitor_next()` | Tomorrow at home minute, or same-day retry after technical error |

Flow:

```text
pg_cron every minute
  → dispatch_widget_monitor_tick()
      → if tick_url or cron_secret empty: STOP
      → fail_stale_widget_monitor_checks(12)
      → pg_net POST tick_url with Bearer cron_secret

Leady /tick
  → verify cron_secret against Vercel env WIDGET_MONITOR_CRON_SECRET
  → fail_stale again
  → claim_due_widget_monitor_check()   // one bot
  → HMAC-sign payload
  → POST GAS web app (8 second timeout)

GAS doPost
  → verify HMAC
  → enqueue (script property + 1ms trigger) so the HTTP request can return fast
  → drainMonitorQueue_ opens Cloudflare
  → POST Leady /complete (HMAC)

Leady complete.ts
  → installed / missing / check_error
  → maybe event installed / removed / reinstalled
  → schedule_widget_monitor_next()
```

If `widget_monitor_settings.tick_url` or `cron_secret` is empty, **nothing after the first box runs**. That is why a 4:40 test did nothing even though `next_check_at` was set.

---

## 3. Tables (database)

All in schema `public`.

### 3.1 `widget_monitor_settings` — one row for the whole product

Columns:

- `id` — always `1`
- `tick_url` — full URL of Leady tick, example shape: `https://YOUR-LIVE-DOMAIN/api/internal/widget-monitor/tick`
- `cron_secret` — must match Vercel `WIDGET_MONITOR_CRON_SECRET`
- `updated_at`

This is **not** per customer. One row. Timer reads only this.

**How it is supposed to get filled (current code, awkward):**  
When a dashboard user saves allowed domains, `enrollBotWidgetMonitor` → `syncWidgetMonitorDispatchSettings()` copies Vercel env into this row. That is a side effect of Save. It is **not** because domain and this table are related.

If nobody has saved a domain **after** `WIDGET_MONITOR_CRON_SECRET` exists on the running server, the row stays empty. You can also type the two values in Table Editor. The timer does not care how they got there.

`tick_url` is built as `NEXT_PUBLIC_APP_URL` + `/api/internal/widget-monitor/tick`. If that env is `http://localhost:3000`, the timer would call your laptop, which fails.

RLS (row security): `anon` / `authenticated` cannot read this table. `service_role` can.

### 3.2 `bot_widget_monitors` — one row per bot

This **is** per bot (per chatbot). This is the daily schedule + status.

Important columns:

| Column | Meaning |
|---|---|
| `bot_id` | Which chatbot |
| `domain` | Copy of first allowed domain at enroll time |
| `install_status` | `never_seen` \| `installed` \| `removed` |
| `purchase_at` | From `customers.lifetime_access_granted_at` |
| `install_window_end_at` | Purchase + 30 days. First “installed” event only counts inside this window |
| `first_installed_at` | Set once. Never reset in complete.ts |
| `active_monitoring_start_at` / `active_monitoring_end_at` | After first install inside the window: 30 more days of daily checks |
| `last_seen_at` | Last successful heartbeat (visitor or checker) |
| `last_checked_at` | Last finished daily attempt |
| `last_error` | Last technical error text, or null |
| `slot_minute` | Home minute of the UTC day, `0–1439`. Example: 640 = 10:40 UTC. **Not changed on retries** |
| `next_check_at` | When this bot is due. Can be home slot tomorrow, or ~1 hour later on a retry |
| `in_progress_at` | Set while a check is running |
| `current_check_id` | UUID of the open check |
| `check_heartbeat_at` | Heartbeat arrived for **this** `current_check_id` |
| `completed_at` | Monitoring finished (windows over). No more `next_check_at` |

Unique index: one active `slot_minute` among rows that still have `next_check_at`. Home minutes do not collide. Retry times are **not** that unique index; retries pick a free **clock minute** so two bots are not claimed in the same minute.

### 3.3 `bot_widget_monitor_checks` — one row per attempt

| Column | Meaning |
|---|---|
| `check_id` | UUID put on the website as `?leady_check=` |
| `website_url` | URL Cloudflare opened |
| `result` | `installed` \| `missing` \| `check_error` or null if still running |
| `page_ok` | Did Cloudflare load the page? |
| `heartbeat_matched` | Widget posted this `check_id` |
| `visitor_heartbeat_protected` | Real visitor pinged near the check window, so we do not mark missing |
| `started_at` / `completed_at` | Timing |

Same-day retries **count** completed rows with `result = check_error` on the current **UTC** calendar day.

### 3.4 `bot_widget_monitor_events` — only when status meaning changes

`event_type`: `installed` | `removed` | `reinstalled`.  
Not written for every daily “still installed” check.

### 3.5 Other tables used, not owned by this feature

- `customers.has_lifetime_access`, `lifetime_access_granted_at` — must be paid lifetime
- `bots`
- `bot_allowed_domains` — host allow-list for heartbeat; first domain used at enroll
- `bot_website_sources.website_url` — preferred URL to open; else `https://{domain}`

---

## 4. How a bot gets onto the schedule (enroll)

File: `src/lib/security/domain.ts` after saving or clearing domains → `enrollBotWidgetMonitor`.

SQL: `enroll_bot_widget_monitor(p_bot_id)`.

Rules:

1. Customer must have `has_lifetime_access = true` and a `lifetime_access_granted_at`. Else skip.
2. Insert/update monitor row: `purchase_at`, `install_window_end_at = purchase + 30 days`, `domain`.
3. If `completed_at` already set → do not schedule again.
4. If first install happened and active 30-day window already ended → mark complete, stop.
5. If never installed and install window already ended → mark complete, stop.
6. If no domain → wait (`next_check_at` null).
7. Else allocate `slot_minute` if missing: prefer purchase UTC hour*60+minute, walk nearby minutes until unique.
8. Set `next_check_at` to `now()` if it was null (due immediately once), keep existing next time otherwise.

Enroll errors are swallowed in TypeScript (`catch { return }`), so a failed enroll is silent.

---

## 5. The minute timer in detail

Job name: `dispatch-widget-monitor-tick`  
Schedule: every minute  
SQL: `SELECT public.dispatch_widget_monitor_tick();`

That function:

1. Calls `fail_stale_widget_monitor_checks(12)` (hung jobs → `check_error`, then same-day retry helper).
2. Reads `widget_monitor_settings` id=1.
3. If URL or secret blank → `{ skipped: true, reason: 'not_configured' }`. **This is the empty-table stop.**
4. Else `net.http_post` to `tick_url` with header `Authorization: Bearer {cron_secret}`, body `{"source":"pg_cron"}`, 8s timeout.

`pg_net` is async. The cron job can succeed even if Leady is down. The claim happens **inside** `/tick`, not inside the cron function. So if settings are empty, **no claim happens**.

---

## 6. Tick API in detail

Route: `src/app/api/internal/widget-monitor/tick/route.ts`  
Logic: `src/lib/monitoring/dispatch.ts`

1. `verifyCronSecret`: Bearer token must equal `WIDGET_MONITOR_CRON_SECRET` on **the server that handles the request** (Vercel production). Table secret and Vercel secret must match.
2. `fail_stale_widget_monitor_checks(12)` again.
3. If `GAS_MONITOR_WEB_APP_URL` or `GAS_MONITOR_HMAC_SECRET` missing on that server → `{ dispatched: false, reason: 'not_configured' }` (settings can be filled and this still no-ops).
4. `claim_due_widget_monitor_check()`:
   - Pick oldest `next_check_at <= now()`, not in progress, not completed, has domain, has a `bot_allowed_domains` row
   - `FOR UPDATE SKIP LOCKED` so two ticks cannot take the same bot
   - Set `in_progress_at`, `current_check_id`, clear `check_heartbeat_at`
   - Insert checks row with new UUID
   - Website URL = `bot_website_sources.website_url` or `https://{first allowed domain}`
5. Build payload:
   - `action: monitor_check`
   - `checkId`, `botId`, `websiteUrl`
   - `completeUrl` = `NEXT_PUBLIC_APP_URL` + `/api/internal/widget-monitor/complete`
   - `exp` = now + 15 minutes
   - `sig` = HMAC-SHA256 of a fixed JSON field order
6. `fetch` GAS, 8 seconds. If fetch throws, the bot **stays in_progress**. Stale sweep later marks `check_error`.

One tick = **one** bot per minute (plus whatever is already in GAS queue).

---

## 7. HMAC (shared secret signatures)

File: `src/lib/monitoring/hmac.ts`  
GAS: same canonical JSON in `InstallChecker.js`

Two message types:

- `monitor_check` — Leady → GAS (includes `completeUrl`)
- `monitor_complete` — GAS → Leady (`pageOk`, `errorMessage`)

TTL 15 minutes. Secret: `GAS_MONITOR_HMAC_SECRET` on Vercel **and** GAS script property with the same name. If they differ, GAS returns Unauthorized or `/complete` returns 401.

Cron secret is **different**: `WIDGET_MONITOR_CRON_SECRET`. Only used timer → `/tick`. Not sent to GAS.

---

## 8. Google Apps Script in detail

Deployed as its **own** web app. URL = `GAS_MONITOR_WEB_APP_URL`.

Script properties:

- `GAS_MONITOR_HMAC_SECRET`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `LOG_SHEET_ID` (automatic checks only)
- `LOG_SHEET_TAB` (default `InstallChecks`)

`doPost`:

1. Parse JSON, `verifyCheck_`
2. `enqueueCheck_`: save body as `PENDING_{checkId}`, create a time trigger `after(1)` to `drainMonitorQueue_`
3. Return `{ ok: true, accepted: true }` quickly (Apps Script HTTP limit)

`drainMonitorQueue_`:

1. Take one pending job
2. Open `websiteUrl?leady_check={checkId}` (or `&` if URL already has `?`)
3. Cloudflare `POST .../browser-rendering/content` with `waitUntil: "load"`, timeout 45s
4. `pageOk` = HTTP 2xx and Cloudflare `success` not false
5. `widgetFound` = HTML contains strings like `widget.js`, `data-bot-id`, etc. **Sheet only**
6. Log sheet row
7. `reportComplete_` with **`pageOk` only** (not `widgetFound`)

Manual `runManualInstallCheck` does **not** write Supabase or the sheet. Executions log only.

If Cloudflare cannot reach the site (“address unavailable”, HTTP error, timeout) → `pageOk: false` → Leady `check_error`.

---

## 9. Heartbeat — “did the widget run?”

`public/widget.js` `sendHeartbeat` runs **immediately** after `botId` and `baseUrl` are known, **before** the iframe. Errors are swallowed so the widget still loads.

POST `{ botId, pageUrl, checkId? }` to `{baseUrl}/api/v1/widget-heartbeat`.  
`checkId` comes from `?leady_check=` on the **page URL** (Cloudflare adds this).

`recordWidgetHeartbeat`:

1. Bot must exist
2. Page host must be on `bot_allowed_domains` (same allow-list as chat)
3. If no monitor row → `{ recorded: false }` (no crash)
4. Update `last_seen_at` (skip if last write < 2 seconds, to reduce spam)
5. If `checkId` equals `current_check_id` → set `check_heartbeat_at` and `heartbeat_matched` on the open check

CORS: echo `Origin` (needed because the script runs on the customer site). Domain check is in the handler, not only CORS.

A **normal visitor** (no `leady_check`) still updates `last_seen_at`. That is used for false-missing protection.

---

## 10. Complete — how “on the website or not” is decided

`complete.ts` is the only place that changes `install_status` from a daily check.

Duplicate complete (already has `result`) → return early. Idempotent.

### 10.1 Check result (this attempt)

| Condition | `result` |
|---|---|
| `pageOk === false` (Cloudflare/GAS failed) | `check_error` |
| else if this check’s heartbeat matched **or** `check_heartbeat_at` set | `installed` |
| else if `last_seen_at` is within 2 minutes **before** `started_at` or later | `installed` (`visitor_heartbeat_protected`) |
| else page opened but no widget proof | `missing` |

So: **page did not open** = technical error. **Page opened, widget did not ping, and no nearby visitor ping** = missing. HTML `widgetFound` is ignored for status.

### 10.2 Status machine (`install_status`)

| Old status | This result | New status | Event |
|---|---|---|---|
| never_seen | installed, and still inside 30-day install window, and `first_installed_at` empty | installed | `installed`; set first install + active 30-day window |
| never_seen | installed, **outside** install window | installed | **no** first_installed, **no** event (status becomes installed but windows may already be over — see stop rules) |
| removed | installed | installed | `reinstalled` |
| installed | installed | installed | none |
| installed | missing | removed | `removed` |
| any | check_error | **unchanged** | none |
| never_seen | missing | never_seen | none |
| removed | missing | removed | none |

`check_error` must never become `removed`.  
`first_installed_at` is never cleared.

### 10.3 When daily checking stops

`shouldStop` if:

- active monitoring end time has passed, or
- still `never_seen` and install window (purchase+30d) has passed

Then: `slot_minute` null, `next_check_at` null, `completed_at` set. No more ticks for that bot.

Otherwise call `schedule_widget_monitor_next(bot_id, was_check_error)`.

---

## 11. Next check time (home slot vs same-day retry)

`slot_minute` is the **home** UTC minute. Retries do not change it.

`schedule_widget_monitor_next`:

1. If completed or no slot → clear schedule.
2. Count today’s UTC `check_error` rows for this bot (including the one just written).
3. If this finish **was** `check_error` **and** count is 1 or 2 **and** `now+1 hour` is still today UTC:
   - pick a **free minute** near `now+1 hour` (walk +1, −1, +2…; skip minutes other bots use for `next_check_at` or `in_progress_at`; stay on same UTC day)
4. Else (installed, missing, 3rd error, or +1h would be tomorrow):
   - `widget_monitor_next_slot_at(slot_minute)` = next UTC time of that home minute (tomorrow if today’s home minute already passed)

Hung check (in progress > 12 minutes): marked `check_error`, then the **same** scheduler (counts as an error try).

---

## 12. URL Cloudflare actually opens

1. Prefer `bot_website_sources.website_url`
2. Else `https://` + first `bot_allowed_domains.domain`
3. Append `leady_check={uuid}`

If monitor.domain is stale (e.g. still an old hostname) but `website_url` is correct, Cloudflare uses `website_url`. Heartbeat still requires the **page host** to match allowed domains. If Cloudflare opens site A but allowed domain is only B, heartbeat is rejected → likely `missing` even if the widget ran.

---

## 13. Dashboard

`overview-data.ts` maps monitor to:

- status never_seen / installed / removed
- firstInstalledAt, lastSeenAt, lastCheckedAt
- label: Waiting for website / Active / Completed / Not started

Customers can SELECT their own monitor/checks/events via RLS. They cannot write those tables as `authenticated`.

---

## 14. Env vars (names only)

**Vercel (production), used by Next.js**

| Name | Used for |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `tick_url` and `completeUrl` host |
| `WIDGET_MONITOR_CRON_SECRET` | Timer → `/tick`; copied into settings if enroll sync runs |
| `GAS_MONITOR_WEB_APP_URL` | Tick → GAS |
| `GAS_MONITOR_HMAC_SECRET` | Sign/verify GAS payloads |

**GAS script properties**

HMAC, Cloudflare account + token, optional sheet id.

The timer **cannot** read Vercel. That is why `widget_monitor_settings` exists at all.

---

## 15. File map

| File | Role |
|---|---|
| `supabase/migrations/20260814100000_widget_install_monitoring.sql` | Tables, enroll, claim, original stale, cron, settings |
| `supabase/migrations/20260815143000_widget_monitor_same_day_retries.sql` | Retry helper; replaces stale body |
| `src/lib/monitoring/enroll.ts` | Copy settings from env; call enroll RPC |
| `src/lib/monitoring/dispatch.ts` | Tick body |
| `src/lib/monitoring/complete.ts` | Result + status |
| `src/lib/monitoring/heartbeat.ts` | Heartbeat writes |
| `src/lib/monitoring/hmac.ts` | Signatures + cron bearer |
| `src/lib/monitoring/cors.ts` | Heartbeat CORS |
| `src/app/api/internal/widget-monitor/tick/route.ts` | Tick HTTP |
| `src/app/api/internal/widget-monitor/complete/route.ts` | Complete HTTP |
| `src/app/api/v1/widget-heartbeat/route.ts` | Public heartbeat |
| `src/lib/security/domain.ts` | Save domain → enroll |
| `public/widget.js` | Heartbeat send |
| `google-apps-script/InstallChecker.js` | Browser open + complete report |

---

## 16. Known sharp edges (from the actual code, not theory)

1. **Empty settings row** → cron runs, skips, no checks. Filling the row (Table Editor or a Save **after** secret exists on that server) is required.
2. **Save domain copies global settings** — bad coupling; every Save overwrites the same one row.
3. Enroll/sync **swallow errors**.
4. Tick **claim-then-fetch**: GAS down → row stuck 12 minutes → `check_error` + retry rules.
5. `completeUrl` / `tick_url` follow `NEXT_PUBLIC_APP_URL`. Localhost there breaks production timer/complete.
6. GAS `widgetFound` does not drive `install_status`.
7. One tick per minute per invocation; many due bots wait in line (`ORDER BY next_check_at`).
8. Heartbeat CORS allows the request Origin header through; **authorization** is domain allow-list on `pageUrl`.

---

## 17. End-to-end example

Bot home `slot_minute = 640` (10:40 UTC). Settings filled. Lifetime purchase yesterday. Domain saved. `next_check_at` = today 10:40 UTC.

1. 10:40 UTC cron POSTs `/tick`.
2. Claim creates `check_id` `abc`, `in_progress_at` now, URL `https://customer.com/?leady_check=abc`.
3. GAS Cloudflare loads that URL.
4. `widget.js` POSTs heartbeat with `checkId=abc`.
5. GAS POSTs complete `pageOk: true`.
6. complete.ts: heartbeat matched → `result=installed`. If first time inside window → status `installed`, event `installed`, active end = now+30d.
7. `schedule_widget_monitor_next(false)` → tomorrow 10:40 UTC. `slot_minute` still 640.

If Cloudflare fails: `check_error`, status unchanged, `next_check_at` ≈ +1 hour free minute. Third error today → tomorrow 10:40 UTC.

If page opens and widget.js never runs and no visitor ping: `missing`. If status was `installed` → `removed` + event. Next check tomorrow home slot (**no** same-day retry for missing).

---

*Generated from the repository as of the widget-monitor + same-day-retry migrations. If code changes, update this file.*
