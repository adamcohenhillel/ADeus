import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.26.0/mod.ts";
import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";
import { ApplicationError, UserError } from "../common/errors.ts";


interface ChatClient {
  chat: {
    completions: {
      create: (params: { model: string; messages: Message[] }) => Promise<{ choices: Choice[] }>;
    };
  };
  embeddings: {
    create: (params: { model: string; input: string }) => Promise<{ data: any[] }>; // Adjust the return type according to your actual data structure
  };
}

interface SearchResult {
  id: number;
  raw_text: string;
  similarity: number;
}

interface Message {
  role: string;
  content: string;
}

interface Choice {
  message: string;
}

// Current models available
type ModelName = "nousresearch/nous-capybara-34b" | "mistral" | "gpt-4-0125-preview";

async function generateResponse(
  useOpenRouter: boolean,
  useOllama: boolean,
  openaiClient: ChatClient,
  openRouterClient: ChatClient | null,
  ollamaClient: ChatClient | null,
  messages: Message[]
) {

  let client: ChatClient;
  let modelName: ModelName;

  if (useOpenRouter && openRouterClient !== null) {
    client = openRouterClient;
    modelName = "nousresearch/nous-capybara-34b";
  } else if (useOllama && ollamaClient !== null) {
    client = ollamaClient;
    modelName = "mistral";
  } else {
    client = openaiClient;
    modelName = "gpt-4-0125-preview";
  }

  const { choices } = await client.chat.completions.create({
    model: modelName,
    messages,
  });
  console.log("Completion: ", choices[0]);
  return choices[0].message;
}

async function prepareChatMessagesWithEmbeddingRecords(
  openaiClient: ChatClient,
  supabase: any, 
  messageHistory: Message[]
): Promise<Message[]> {

  // Embed the last messageHistory message using OpenAI's embeddings API
  const embeddingsResponse = await openaiClient.embeddings.create({
    model: "text-embedding-3-small",
    input: messageHistory[messageHistory.length - 1].content,
  });
  const embeddings = embeddingsResponse.data[0].embedding;

  // Retrieve records from Supabase based on embeddings similarity
  const response = await supabase.rpc(
    "match_records_embeddings_similarity",
    {
      query_embedding: JSON.stringify(embeddings),
      match_threshold: 0.1,
      match_count: 10,
    }
  );

  if (response.error) {
    console.log("recordsError: ", response.error);
    throw new ApplicationError("Error getting records from Supabase");
  }

  const relevantRecords: SearchResult[] = response.data;

  // Ensure relevantRecords is not undefined or null
  if (!relevantRecords) {
    // Later we can do something more robust here, maybe some kind of retry mechanism, or have the AI respond.
    throw new ApplicationError("No relevant records found");
  }
  
  console.log("relevantRecords: ", response.data);

  let messages = [
    {
      role: "system",
      content: `You are a helpful assistant, helping the user navigate through life. He is asking you questions, and you answer them with the best of your ability.
      You have access to some of their records, to help you answer their question in a more personalized way.

      Records:
      ${relevantRecords.map((record) => record.raw_text).join("\n")}
        `,
    },
    ...messageHistory,
  ];

  return messages;
}

const chat = async (req: Request) => {
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

  let openRouterClient: ChatClient | null = null;
  if (useOpenRouter) {
    openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterApiKey,
    });
  }

  const ollamaApiKey = Deno.env.get("OLLAMA_BASE_URL");
  const useOllama = Boolean(ollamaApiKey); // Use Ollama if OLLAMA_BASE_URL is available

  let ollamaClient: ChatClient | null = null;
  if (useOllama) {
    ollamaClient = new OpenAI({
      baseURL: Deno.env.get("OLLAMA_BASE_URL"),
      apiKey: "ollama"
    });
  }

  const messages = await prepareChatMessagesWithEmbeddingRecords(openaiClient, supabase, messageHistory)

  try {
    const responseMessage = await generateResponse(
      useOpenRouter,
      useOllama,
      openaiClient,
      openRouterClient,
      ollamaClient,
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
