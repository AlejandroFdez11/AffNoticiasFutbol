-- AFFutbol — Phase 6: schedule the push jobs
--
-- Four pg_cron jobs call the `send-push` Edge Function with a `job` in the body:
--
--   * push-reminders     every 10 min  — 1 h before a favourite team's kickoff
--   * push-results       every 15 min  — after `settle-predictions` closes them
--   * push-rankings      hourly        — position changes, global and leagues
--   * push-sync-fixtures daily 04:20   — 2 API-Football requests (today+tomorrow)
--
-- Only the fixture sync spends API-Football quota (2 of the 100 daily requests).
-- The reminder reads the local cache, so running it every 10 minutes is free.
--
-- The shared secret is NOT stored in this file: it is read at run time from
-- Supabase Vault, where it must be created once by hand (same value as the
-- function secret `PUSH_NOTIFY_SECRET`):
--
--   select vault.create_secret('<same value as PUSH_NOTIFY_SECRET>',
--                              'notify_secret',
--                              'Shared secret for the send-push cron jobs');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Re-running the migration replaces each job instead of duplicating it.
create or replace function public.schedule_push_job(
  p_name text,
  p_schedule text,
  p_job text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from cron.job where jobname = p_name) then
    perform cron.unschedule(p_name);
  end if;

  perform cron.schedule(
    p_name,
    p_schedule,
    format(
      $command$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-notify-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'notify_secret'
            limit 1
          )
        ),
        body := jsonb_build_object('job', %L),
        timeout_milliseconds := 30000
      );
      $command$,
      'https://bezonbkgatfzioyepors.supabase.co/functions/v1/send-push',
      p_job
    )
  );
end;
$$;

-- SECURITY DEFINER: only the migration owner may schedule jobs.
revoke execute on function public.schedule_push_job(text, text, text)
  from public, anon, authenticated;

select public.schedule_push_job('push-reminders', '*/10 * * * *', 'reminders');
select public.schedule_push_job('push-results', '*/15 * * * *', 'results');
select public.schedule_push_job('push-rankings', '7 * * * *', 'rankings');
select public.schedule_push_job('push-sync-fixtures', '20 4 * * *', 'sync-fixtures');
