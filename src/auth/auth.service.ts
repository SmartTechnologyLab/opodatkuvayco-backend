import { Injectable } from '@nestjs/common';
import { AuthError, SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabaseClient: SupabaseClient;
  constructor() {
    this.supabaseClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY,
    );
  }

  async signInGoogle() {
    const { error, data } = await this.supabaseClient.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw new AuthError(error.code);

    return data.url;
  }

  async logout() {
    const { error } = await this.supabaseClient.auth.signOut();

    if (error) throw new AuthError(error.code);

    return 'User logged out';
  }
}
