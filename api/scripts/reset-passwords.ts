import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// Create Supabase client with Service Role Key to bypass RLS and perform admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Connecting to Supabase admin API...");
  const admin = supabase.auth.admin;

  let page = 1;
  const targetPassword = "Cloviana@987654321";
  let resetCount = 0;

  while (page <= 20) {
    const { data, error } = await admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error("Error listing users:", error.message);
      break;
    }

    if (!data.users || data.users.length === 0) {
      break;
    }

    console.log(`Found ${data.users.length} users on page ${page}. Resetting passwords...`);
    for (const user of data.users) {
      if (!user.email) continue;
      console.log(`- Resetting password for: ${user.email} (ID: ${user.id})...`);
      const { error: updateError } = await admin.updateUserById(user.id, {
        password: targetPassword,
        email_confirm: true // auto-confirm just in case
      });

      if (updateError) {
        console.error(`  ❌ Failed to update user ${user.email}:`, updateError.message);
      } else {
        console.log(`  ✅ Successfully set password to "${targetPassword}"`);
        resetCount++;
      }
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  console.log(`\nDone! Successfully reset passwords for ${resetCount} users to "${targetPassword}".`);
}

main().catch((e) => console.error(e));
