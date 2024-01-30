import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.26.0/mod.ts";

import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";

const chat = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const supabase = supabaseClient();

  const openaiClient = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  console.log("**** Code version 0.0.2 ****");

  return new Response(
    JSON.stringify({ message: "Audio transcribed successfully.", transcript }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
};

serve(chat);
