import { AppConfiguration } from "@/config/app.configuration";
import { Injectable } from "@nestjs/common";
import { SupabaseClient, createClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly adminClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor(private readonly config: AppConfiguration) {
    this.adminClient = createClient(
      config.supabaseUrl,
      config.supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    this.anonClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }
}
