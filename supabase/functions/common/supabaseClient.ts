import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

export const supabaseClient = (req: Request, authToken?: string) =>
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: {
          Authorization: authToken ?? req.headers.get("Authorization")!,
        },
      },
    }
  );
