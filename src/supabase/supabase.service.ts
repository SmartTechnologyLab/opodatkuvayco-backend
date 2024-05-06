import { Injectable } from '@nestjs/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_API_KEY,
    );
  }

  async fetchData(table: string) {
    try {
      const { data, error } = await this.supabase.from(table).select('*');

      if (error) {
        throw new Error('Failed to fetch data from the DB' + error.message);
      }

      return data;
    } catch (error) {
      throw new Error('Failed while fetching data' + error);
    }
  }

  async findData(table: string, findParam: string, findValue: string) {
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq(findParam, findValue);

      if (error) {
        console.error(error);
        throw new Error('Failed while finding data: ' + error.message);
      }

      if (data && data.length > 0) {
        return data[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error(error);
      throw new Error('Failed while finding data: ' + error.message);
    }
  }

  async insertData<T>(tableName: string, data: T) {
    try {
      const { error } = await this.supabase.from(tableName).insert(data);

      if (error) {
        throw new Error('Failed while setting the data to DB' + error.message);
      }
    } catch (error) {
      throw new Error('Failed to set data to DB' + error);
    }
  }
}
