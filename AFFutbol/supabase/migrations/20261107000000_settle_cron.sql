-- AFFutbol — Phase 4: schedule the prediction settlement
--
-- Calls the `settle-predictions` Edge Function every 30 minutes with pg_cron
-- and pg_net. The shared secret is NOT stored in this file: it is read at run
-- time from Supabase Vault, where it must be created once by hand:
--
--   select vault.create_secret('<same value as PREDICTIONS_SETTLE_SECRET>',
--                              'settle_secret',
--                              'Shared secret for the settle-predictions cron');
--
-- If the function finds no finished matches with pending predictions it does
-- not call API-Football, so idle runs cost no quota.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Re-running the migration replaces the job instead of duplicating it.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'settle-predictions') then
    perform cron.unschedule('settle-predictions');
  end if;
end;
$$;

select cron.schedule(
  'settle-predictions',
  '*/30 * * * *',
  $job$
  select net.http_post(
    url := 'https://bezonbkgatfzioyepors.supabase.co/functions/v1/settle-predictions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-settle-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'settle_secret'
        limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $job$
);