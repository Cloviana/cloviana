import "dotenv/config";
import { Client } from "pg";

async function main() {
  const conn = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!conn) throw new Error("Missing DATABASE_URL");

  const client = new Client({ connectionString: conn });
  await client.connect();

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
