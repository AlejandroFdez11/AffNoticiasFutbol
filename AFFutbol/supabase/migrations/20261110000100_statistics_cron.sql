-- AFFutbol — Phase 7: schedule the statistics sync
--
-- One pg_cron job calls the `sync-statistics` Edge Function twice a day, after
-- the weekend and the midweek rounds have been played. Each run costs 4
-- football-data.org requests (free tier: 10/min, no daily cap) and 4 Wikipedia
-- requests, so there is no quota to protect here.
--
-- The shared secret is NOT stored in this file: it is read at run time from
-- Supabase Vault, where it must be created once by hand (same value as the
-- function secret `STATISTICS_SYNC_SECRET`):
--
--   select vault.create_secret('<same value as STATISTICS_SYNC_SECRET>',
--                              'statistics_secret',
--                              'Shared secret for the sync-statistics cron job');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Re-running the migration replaces the job instead of duplicating it.
create or replace function public.schedule_statistics_sync(
  p_name text,
  p_schedule text
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
          'x-statistics-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'statistics_secret'
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
      $command$,
      'https://bezonbkgatfzioyepors.supabase.co/functions/v1/sync-statistics'
    )
  );
end;
$$;

-- SECURITY DEFINER: only the migration owner may schedule jobs.
revoke execute on function public.schedule_statistics_sync(text, text)
  from public, anon, authenticated;

select public.schedule_statistics_sync('statistics-sync', '30 3,15 * * *');
