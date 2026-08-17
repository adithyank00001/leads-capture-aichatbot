# Widget monitoring disabled — operator notes

Automatic widget monitoring is **hard-disabled** by default.

Monitoring is **ON** only when `WIDGET_MONITORING_ENABLED=true` is set on the server.

## What was disabled (layers)

1. **Supabase** — migration `20260817143000_disable_widget_monitoring_cron.sql`:
   - Unschedules `dispatch-widget-monitor-tick` pg_cron job
   - Blanks `widget_monitor_settings.tick_url` and `cron_secret`
   - Clears stuck `in_progress_at` on monitor rows (history preserved)

2. **App code** — early returns in monitoring lib + routes when flag is not `"true"`

3. **Domain save** — no longer calls `enrollBotWidgetMonitor`

4. **Dashboard** — monitoring card hidden when disabled

## GAS InstallChecker manual cleanup (do once)

In the **InstallChecker** Google Apps Script project only (not MasterWorker or PageWorker):

1. Open **Project Settings → Script properties**
2. Delete any keys starting with `PENDING_`
3. Open **Triggers** (clock icon) and delete time-based triggers for `drainMonitorQueue_`
4. Optional: undeploy the InstallChecker web app (harmless if left deployed while `/tick` does not dispatch)

## Verify monitoring is off

### Supabase SQL

```sql
SELECT jobname FROM cron.job WHERE jobname = 'dispatch-widget-monitor-tick';
SELECT tick_url, cron_secret FROM widget_monitor_settings WHERE id = 1;
```

Expected: no cron row; NULL URL and secret.

### API (local or production)

```bash
# Heartbeat — should return recorded: false without updating last_seen_at
curl -X POST https://YOUR-APP/api/v1/widget-heartbeat \
  -H "Content-Type: application/json" \
  -d '{"botId":"YOUR_BOT","pageUrl":"https://YOUR-DOMAIN/"}'

# Tick — with cron secret, should return monitoring_disabled (when flag off)
curl -X POST https://YOUR-APP/api/internal/widget-monitor/tick \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### No new activity

```sql
SELECT count(*) FROM bot_widget_monitor_checks WHERE created_at > now() - interval '1 day';
SELECT count(*) FROM bot_widget_monitor_events WHERE created_at > now() - interval '1 day';
```

## Production deploy checklist

1. Deploy app code with guards
2. Apply migration (if not already applied)
3. Set Vercel env: `WIDGET_MONITORING_ENABLED=false` (or omit — default is off)
4. Run GAS InstallChecker cleanup (above)
5. Run `npm run test:domain-security` and `npm run test:smoke` against production or staging

## Re-enable later

1. Fix known lifecycle bugs
2. Set `WIDGET_MONITORING_ENABLED=true`
3. New migration to re-schedule cron + bootstrap `widget_monitor_settings` via deploy hook (not domain save)
4. Re-connect enrollment or backfill lifetime bots
5. Dashboard card reappears automatically when flag is true
