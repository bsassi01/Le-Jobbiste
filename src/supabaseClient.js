import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rvumdkioajyzlejucqus.supabase.co';
const supabaseAnonKey = 'sb_publishable_Mkr0h79y8rfSFP16NHyrXg_LcD1x42M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);