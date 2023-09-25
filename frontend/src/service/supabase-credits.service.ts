import { createSupabaseAdminClient } from '../lib/supabase';

export class SupabaseCreditsService {
  constructor(private readonly supabase = createSupabaseAdminClient()) {}

  async addCreditsToUser(creditsAmount: number, userId: string) {
    const { error } = await this.supabase.rpc('increment_credits', {
      c: creditsAmount * 100,
      u: userId,
    });
    if (error) throw new Error(error.message);
  }
}
