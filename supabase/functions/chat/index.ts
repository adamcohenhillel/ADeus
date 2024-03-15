import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI from "https://deno.land/x/openai@v4.26.0/mod.ts";
import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";
import { ApplicationError, UserError } from "../common/errors.ts";

interface ChatClient {
  chat: {
    completions: {
      create: (params: { model: string; messages: Message[]; stream?: boolean }) => AsyncIterable<{ choices: Choice[] }>;
    };
  };
  embeddings: {
    create: (params: { model: string; input: string }) => Promise<{ data: any[] }>;
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
  delta: {
    content: string;
  };
}

// Current models available
type ModelName = "nousresearch/nous-capybara-34b" | "mistral" | "gpt-4-0125-preview";


const openaiClient = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});
const useOpenRouter = Boolean(Deno.env.get("OPENROUTER_API_KEY")); // Use OpenRouter if API key is available
const useOllama = Boolean(Deno.env.get("OLLAMA_BASE_URL")); // Use Ollama if OLLAMA_BASE_URL is available

async function* generateResponse(
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

  const completion = await client.chat.completions.create({
    model: modelName,
    messages,
    stream: true,
  });

  for await (const chunk of completion) {
    yield chunk.choices[0].delta.content;
  }
}

async function getRelevantRecords(
  openaiClient: ChatClient,
  supabase: any, 
  messageHistory: Message[],
): Promise<Message[]> {

  
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

  const requestBody = await req.json();
  const msgData = requestBody as { messageHistory: Message[]; timestamp: string };

  if (!msgData.messageHistory) throw new UserError("Missing query in request data");
  const messageHistory = msgData.messageHistory;

  const relevantRecords = await getRelevantRecords(openaiClient, supabase, messageHistory)

  let messages = [
    {
      role: "system",
      content: `You are the most helpful and advanced personal assistant ever, helping the user navigate through life. 
      He is asking you questions, and you answer them with the best of your ability.
      You have access to some of their records, to help you answer their question in a more personalized way.
      Respond in a concise and helpful way, unless the user is asking a more complex question. You always use LaTeX formatting with appropriate
      delimiters ($..$, $$..$$) to display any and all math or variables.

      ### Formatting Instructions ###

      IMPORTANT: YOU MUST WRAP ANY AND ALL MATHEMATICAL EXPRESSIONS OR VARIABLES IN LATEX DELIMITERS IN ORDER FOR THEM TO RENDER.
      AVAILABLE DELIMITERS:
        {left: "$$", right: "$$"
        {left: "$", right: "$"},
        {left: "\\(", right: "\\)"},
        {left: "\\begin{equation}", right: "\\end{equation}"}
        {left: "\\begin{align}", right: "\\end{align}"},
        {left: "\\begin{alignat}", right: "\\end{alignat}"},
        {left: "\\begin{gather}", right: "\\end{gather}"},
        {left: "\\begin{CD}", right: "\\end{CD}"},
        {left: "\\[", right: "\\]"}

      What NOT to do:
        - (a + b)^2 = c^2 + 2ab
        - \\sigma_i
        - X
        - (XX^T)
        - [ x\begin{bmatrix} 2 \ -1 \ 1 \end{bmatrix} + y\begin{bmatrix} 3 \ 2 \ -1 \end{bmatrix} ]

      Correct examples (what you SHOULD do):
        - $(a + b)^2 = c^2 + 2ab$
        - $\\sigma_i$
        - $X$
        - ($X$)
        - $XX^T$
        - $$x\begin{bmatrix} 2 \ -1 \ 1 \end{bmatrix} + y\begin{bmatrix} 3 \ 2 \ -1 \end{bmatrix}$$

      Records:
      ${relevantRecords.map((record) => record.raw_text).join("\n")}
        `,
    },
    ...messageHistory,
  ];

  try {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseMessageGenerator = generateResponse(
            useOpenRouter,
            useOllama,
            messages
          );
  
          for await (const chunk of responseMessageGenerator) {
            const jsonResponse = JSON.stringify({ message: chunk }) + "\n";
            const encodedChunk = new TextEncoder().encode(jsonResponse);
            controller.enqueue(encodedChunk);
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });
  
    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("Error: ", error);
    throw new ApplicationError("Error processing chat completion");
  }
};

serve(chat);
