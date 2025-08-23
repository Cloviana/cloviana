import "dotenv/config";
import { Client } from "pg";

async function main() {
  const conn = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) throw new Error("Missing DATABASE_URL");

  const client = new Client({ connectionString: conn });
  await client.connect();

  await client.query(`
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'profiles' and c.conname = 'profiles_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_id_fkey
      foreign key (id) references auth.users(id) on delete cascade;
  end if;
end
$$;

create or replace function public.create_profile_on_signup() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id,"firstName","lastName","profileUrl","createdAt","updatedAt")
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'firstName',''),
    nullif(new.raw_user_meta_data->>'lastName',''),
    nullif(new.raw_user_meta_data->>'profileUrl',''),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists after_insert_auth_users_create_profile on auth.users;
create trigger after_insert_auth_users_create_profile
after insert on auth.users for each row execute function public.create_profile_on_signup();

create or replace function public.delete_profile_on_user_delete() returns trigger language plpgsql security definer as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

drop trigger if exists after_delete_auth_users_delete_profile on auth.users;
create trigger after_delete_auth_users_delete_profile
after delete on auth.users for each row execute function public.delete_profile_on_user_delete();
  `);

  const {
    rows: [{ count: userCount }],
  } = await client.query(`select count(*)::int as count from auth.users`);

  const res = await client.query(`
with to_insert as (
  select u.id,
         nullif(u.raw_user_meta_data->>'firstName','') as first_name,
         nullif(u.raw_user_meta_data->>'lastName','') as last_name,
         nullif(u.raw_user_meta_data->>'profileUrl','') as profile_url
  from auth.users u
  left join public.profiles p on p.id = u.id
  where p.id is null
)
insert into public.profiles (id,"firstName","lastName","profileUrl","createdAt","updatedAt")
select id, first_name, last_name, profile_url, now(), now()
from to_insert
returning id
  `);

  console.log(JSON.stringify({ users: userCount, inserted: res.rowCount }));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
