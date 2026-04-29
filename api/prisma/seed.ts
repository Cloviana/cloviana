import "dotenv/config";
import { Client } from "pg";

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) throw new Error("Missing DATABASE_URL");

  const client = new Client({ connectionString: conn });
  await client.connect();

  const {
    rows: [{ count: userCount }],
  } = await client.query("select count(*)::int as count from auth.users");

  await client.query(`
    update public."profiles" p
    set "email" = au.email,
        "updatedAt" = now()
    from auth.users au
    where p.id = au.id and p."email" is null
  `);

  const resInsert = await client.query(`
    with to_insert as (
      select u.id, u.email
      from auth.users u
      left join public."profiles" p on p.id = u.id
      where p.id is null
    )
    insert into public."profiles" (id, "email", "createdAt", "updatedAt")
    select id, email, now(), now() from to_insert
    returning id
  `);

  const env = process.env.ENVIRONMENT ?? "development";

  const plans = [
    {
      name: "STARTER",
      prices: {
        production: "#",
        development: "price_1STVpcIN5ime0XaQqiMArmxe",
      },
    },
  ] as const;

  const planResults: { name: string; priceId: string }[] = [];

  for (const plan of plans) {
    const priceId =
      plan.prices[env as keyof typeof plan.prices] ?? plan.prices.development;

    const existing = await client.query<{ id: string }>(
      `
      select id
      from public."plans"
      where "name" = $1::"PlanName"
      limit 1
    `,
      [plan.name],
    );

    if (existing.rowCount === 0) {
      await client.query(
        `
        insert into public."plans" ("id", "name", "stripePriceId", "createdAt", "updatedAt")
        values (gen_random_uuid(), $1::"PlanName", $2, now(), now())
      `,
        [plan.name, priceId],
      );
    } else {
      await client.query(
        `
        update public."plans"
        set "stripePriceId" = $1,
            "updatedAt" = now()
        where id = $2
      `,
        [priceId, existing.rows[0].id],
      );
    }

    planResults.push({ name: plan.name, priceId });
  }

  console.log(
    JSON.stringify({
      users: userCount,
      insertedProfiles: resInsert.rowCount,
      env,
      plans: planResults,
    }),
  );

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
