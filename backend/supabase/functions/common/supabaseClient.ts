import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

export const supabaseClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
