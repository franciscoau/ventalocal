const SUPABASE_URL = "https://qouuojxzspkhelxfplnc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_b0-zdx66aVqTgF7HkKPwrQ_LAAXL2_5";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
