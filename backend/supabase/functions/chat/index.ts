import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.26.0/mod.ts";

import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";
import { ApplicationError, UserError } from "../common/errors.ts";

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
  const { messageHistory } = await req.json();
  if (!messageHistory) throw new UserError("Missing query in request data");

  const openaiClient = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  console.log("messageHistory: ", messageHistory);

  // embed the last messageHistory message
  const embeddingsResponse = await openaiClient.embeddings.create({
    model: "text-embedding-ada-002",
    input: messageHistory[messageHistory.length - 1].content,
  });
  const embeddings = embeddingsResponse.data[0].embedding;
  console.log("Embeddings:", embeddings);

  const { data: relevantRecords, error: recordsError } = await supabase.rpc(
    "match_records_embeddings_similarity",
    {
      query_embedding: JSON.stringify(embeddings), // Pass the embedding you want to compare
      match_threshold: 0.8, // Choose an appropriate threshold for your data
      match_count: 10, // Choose the number of matches
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
    let completion = await openaiClient.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: messages,
    });
    console.log("completion: ", completion);
    console.log(
      "completion.choices[0].content: ",
      completion.choices[0].content
    );
    return new Response(
      JSON.stringify({
        msg: completion.choices[0].message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (openAiError) {
    console.log("!!! Error in OpenAI fallback: ", openAiError);
    throw openAiError;
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
