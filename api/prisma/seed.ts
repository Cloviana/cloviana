import 'dotenv/config'
import { Client } from 'pg'

async function main() {
  const conn = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL
  if (!conn) throw new Error('Missing DATABASE_URL')

  const client = new Client({ connectionString: conn })
  await client.connect()

  const { rows: [{ count: userCount }] } = await client.query(`select count(*)::int as count from auth.users`)

  const resInsert = await client.query(`
    with to_insert as (
      select u.id
      from auth.users u
      left join public.profiles p on p.id = u.id
      where p.id is null
    )
    insert into public.profiles (id,"createdAt","updatedAt")
    select id, now(), now() from to_insert
    returning id
  `)

  console.log(JSON.stringify({ users: userCount, inserted: resInsert.rowCount }))
  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
