import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.26.0/mod.ts";

import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";
import { ApplicationError, UserError } from "../common/errors.ts";

async function generateResponse(
  useOpenRouter,
  openaiClient,
  openRouterClient,
  messages
) {
  const client = useOpenRouter ? openRouterClient : openaiClient;
  const modelName = useOpenRouter
    ? "nousresearch/nous-capybara-34b"
    : "gpt-4-1106-preview";

  const { choices } = await client.chat.completions.create({
    model: modelName,
    messages,
  });
  console.log("Completion: ", choices[0]);
  return choices[0].message;
}

const chat = async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const supabaseAuthToken = req.headers.get("Authorization") ?? "";
  if (!supabaseAuthToken)
    throw new ApplicationError("Missing supabase auth token");
  const supabase = supabaseClient(req, supabaseAuthToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    throw new ApplicationError(
      "Unable to get auth user details in request data"
    );
  const requestBody = await req.json();
  const { messageHistory } = requestBody;

  if (!messageHistory) throw new UserError("Missing query in request data");

  const openaiClient = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  const useOpenRouter = Boolean(openRouterApiKey); // Use OpenRouter if API key is available

  let openRouterClient;
  if (useOpenRouter) {
    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterApiKey,
    });
  }

  console.log("messageHistory: ", messageHistory);

  // Embed the last messageHistory message using OpenAI's embeddings API
  const embeddingsResponse = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: messageHistory[messageHistory.length - 1].content,
  });
  const embeddings = embeddingsResponse.data[0].embedding;
  console.log("Embeddings:", embeddings);

  // Retrieve records from Supabase based on embeddings similarity
  const { data: relevantRecords, error: recordsError } = await supabase.rpc(
    "match_records_embeddings_similarity",
    {
      query_embedding: JSON.stringify(embeddings),
      match_threshold: 0.8,
      match_count: 10,
    }
  );

  if (recordsError) {
    console.log("recordsError: ", recordsError);
    throw new ApplicationError("Error getting records from Supabase");
  }

  let messages = [
    {
      role: "system",
      content: `You are a helpful assistant, helping the user navigate through life. He is asking uoi questions, and you answer them with the best of your ability.
      You have access to some of their records, to help you answer their question in a more personalized way.

      Records:
      ${relevantRecords.map((r) => r.raw_text).join("\n")}
        `,
    },
    ...messageHistory,
  ];
  console.log("messages: ", messages);

  try {
    const responseMessage = await generateResponse(
      useOpenRouter,
      openaiClient,
      openRouterClient,
      messages
    );

    return new Response(
      JSON.stringify({
        msg: responseMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.log("Error: ", error);
    throw new ApplicationError("Error processing chat completion");
  }

  return new Response(
    JSON.stringify({
      msg: { role: "assistant", content: "Hello from Deno Deploy!" },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
};

serve(chat);
