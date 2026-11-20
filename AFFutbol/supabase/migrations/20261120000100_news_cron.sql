-- AFFutbol — schedule the news refresh
--
-- Before this job, `news-refresh` only ran when the app asked for it (manual
-- pull-to-refresh, or once when `news_items` was empty), so a populated feed
-- never picked up new headlines on its own. One pg_cron job now calls the
-- function every 30 minutes, well above the 10-minute throttle per source.
--
-- The shared secret is NOT stored in this file: it is read at run time from
-- Supabase Vault, where it must be created once by hand (same value as the
-- function secret `NEWS_REFRESH_SECRET`):
--
--   select vault.create_secret('<same value as NEWS_REFRESH_SECRET>',
--                              'news_secret',
--                              'Shared secret for the news-refresh cron job');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Re-running the migration replaces the job instead of duplicating it.
create or replace function public.schedule_news_refresh(
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
          'x-news-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'news_secret'
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
      $command$,
      'https://bezonbkgatfzioyepors.supabase.co/functions/v1/news-refresh'
    )
  );
end;
$$;

-- SECURITY DEFINER: only the migration owner may schedule jobs.
revoke execute on function public.schedule_news_refresh(text, text)
  from public, anon, authenticated;

select public.schedule_news_refresh('news-refresh', '*/30 * * * *');
