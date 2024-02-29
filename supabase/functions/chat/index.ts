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

const openaiClient = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const useOpenRouter = Boolean(Deno.env.get("OPENROUTER_API_KEY")); // Use OpenRouter if API key is available
const useOllama = Boolean(Deno.env.get("OLLAMA_BASE_URL")); // Use Ollama if OLLAMA_BASE_URL is available

async function generateResponse(
  useOpenRouter: boolean,
  useOllama: boolean,
  messages: Message[]
) {

  let client: ChatClient;
  let modelName: ModelName;

  if (useOpenRouter) {
    client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: Deno.env.get("OPENROUTER_API_KEY"),
    });
    modelName = "nousresearch/nous-capybara-34b";
  } else if (useOllama) {
    client = new OpenAI({
      baseURL: Deno.env.get("OLLAMA_BASE_URL"),
      apiKey: "ollama"
    });
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

async function getRelevantRecords(
  openaiClient: ChatClient,
  supabase: any, 
  msgData: any,
): Promise<Message[]> {

  const messageHistory = msgData.messageHistory;
  const timestamp = msgData.timestamp;

  let lastMessage = [messageHistory[messageHistory.length - 1]];

  const systemMessage = {
    role: "system",
    content: `Your objective is to determine the intent of the users message. Their requests can vary but will often be asking about their day, week, month and life. 
    Use the current date time ${timestamp} to help you answer their questions. 
    `,
  };
  
  const optimnizedUserMsg = await generateResponse(
    useOpenRouter,
    useOllama,
    messages
  );
  console.log(timestamp);
  // Embed the last messageHistory message using OpenAI's embeddings API
  const embeddingsResponse = await openaiClient.embeddings.create({
    model: "text-embedding-3-small",
    input: messageHistory[messageHistory.length - 1].content,
  });
  const embeddings = embeddingsResponse.data[0].embedding;
  
  console.log(messageHistory[messageHistory.length - 1]);
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

  return relevantRecords;
  
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
  const msgData = requestBody as { messageHistory: Message[]; timestamp: string };

  if (!msgData.messageHistory) throw new UserError("Missing query in request data");

  const relevantRecords = await getRelevantRecords(openaiClient, supabase, messageHistory)

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

  try {
    const responseMessage = await generateResponse(
      useOpenRouter,
      useOllama,
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
};

serve(chat);
