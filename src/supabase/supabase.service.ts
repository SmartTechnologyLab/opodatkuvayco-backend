import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SuperbaseService {
  constructor(private readonly superbase: SupabaseClient) {
    this.superbase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_API_KEY,
    );
  }

  async fetchData(table: string) {
    const { data, error } = await this.superbase.from(table).select('*');

    if (error) {
      throw new Error('Failed to fetch data from the DB' + error.message);
    }

    return data;
  }

  async insertData<T>(tableName: string, data: T) {
    try {
      const { error } = await this.superbase.from(tableName).insert(data);

      if (error) {
        throw new Error('Failed while setting the data to DB' + error.message);
      }
    } catch (error) {
      throw new Error('Failed to set data to DB' + error);
    }
  }
}
