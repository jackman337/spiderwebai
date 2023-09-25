import { createSupabaseAdminClient } from '../lib/supabase';

export class SupabaseUserProfileService {
  constructor(private readonly supabase = createSupabaseAdminClient()) {}

  async getCurrentUser() {
    const { data, error } = await this.supabase.auth.getUser();
    if (error) throw Error(error.message);

    return data.user;
  }

  async getCustomerId(userId?: string) {
    return await this.getField('stripe_id', userId);
  }

  async getFieldBy(field: string, where: string, value: string) {
    const { error, data } = await this.supabase
      .from('profiles')
      .select(field)
      .filter(where, 'eq', value)
      .single();

    if (error) throw Error(error.message);

    const res = data?.[field as any];
    if (!res) throw Error(`cannot find ${where}=${value} in supabase`);

    return res;
  }

  async getUserIdFromCustomerId(customerId: string): Promise<string> {
    return await this.getFieldBy('id', 'stripe_id', customerId);
  }

  async getUserIdByEmail(email: string): Promise<string> {
    return this.getFieldBy('id', 'email', email);
  }

  async getCustomerIdByEmail(email: string): Promise<string> {
    return this.getFieldBy('stripe_id', 'email', email);
  }

  async getCustomerIdByUserId(id: string): Promise<string> {
    return this.getFieldBy('stripe_id', 'id', id);
  }

  async getField(
    field: string,
    userId?: string,
    returnObject?: boolean
  ): Promise<string | number | Record<string, any>> {
    userId ??= (await this.getCurrentUser()).id;

    const { data, error } = await this.supabase
      .from('profiles')
      .select(field)
      .eq('id', userId)
      .limit(1)
      .single();

    if (error) throw Error(error.message);

    return returnObject ? data : data[field as any];
  }

  async getFields(field: string, userId?: string, returnObject?: boolean) {
    return await this.getField(field, userId, returnObject);
  }
}
