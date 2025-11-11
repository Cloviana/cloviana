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

  await client.query(`
    update public."profiles" p
    set "email" = au.email,
        "contactEmail" = coalesce(au.raw_user_meta_data->>'contactEmail', au.email),
        "updatedAt" = now()
    from auth.users au
    where p.id = au.id and p."email" is null
  `);

  const resInsert = await client.query(`
    with to_insert as (
      select u.id, u.email, coalesce(u.raw_user_meta_data->>'contactEmail', u.email) as contact_email
      from auth.users u
      left join public."profiles" p on p.id = u.id
      where p.id is null
    )
    insert into public."profiles" (id, "email", "contactEmail", "createdAt", "updatedAt")
    select id, email, contact_email, now(), now() from to_insert
    returning id
  `);

  console.log(
    JSON.stringify({ users: userCount, inserted: resInsert.rowCount }),
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
