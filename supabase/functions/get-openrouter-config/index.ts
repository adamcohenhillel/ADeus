import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders } from "../common/cors.ts";
import { ApplicationError } from "../common/errors.ts";

async function fetchOpenRouterModels() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    if (!response.ok) throw new Error("Failed to fetch OpenRouter models");
    const data = await response.json();
    return data.data; // Adjust this line based on the actual structure of the response
  } catch (error) {
    console.error("Error fetching OpenRouter models:", error);
    throw new ApplicationError("Error fetching OpenRouter models");
  }
}

const getOpenRouterConfig = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const isOpenRouterAvailable = Boolean(openRouterApiKey);

  let models = [];

  if (isOpenRouterAvailable) {
    try {
      models = await fetchOpenRouterModels();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message || "Error fetching models",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  }

  return new Response(
    JSON.stringify({
      isOpenRouterAvailable,
      models,
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
};

serve(getOpenRouterConfig);
