-- AFFutbol — Phase 5 follow-up: quiet a plpgsql lint warning.
--
-- generate_invite_code() declared its own counter `i`, which the
-- `for i in 1..6` loop then shadowed, so the declared variable was never used
-- (`supabase db lint` reported "unused variable" / "shadows a previously
-- defined variable"). The behaviour is unchanged: plpgsql declares the loop
-- variable implicitly. Re-creating the function without it keeps the schema
-- lint-clean.

create or replace function public.generate_invite_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';

    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;

    exit when not exists (select 1 from public.leagues where invite_code = code);
  end loop;

  return code;
end;
$$;

-- create or replace keeps the existing grants; re-revoking is just idempotent
-- insurance. Only create_league() may call this, as the definer.
revoke execute on function public.generate_invite_code() from public, anon, authenticated;
