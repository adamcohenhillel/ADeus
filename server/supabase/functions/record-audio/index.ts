import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders } from "../common/cors.ts";
import OpenAI from "https://deno.land/x/openai@v4.26.0/mod.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";

async function transcribe(fileData) {
  console.log("Transcribing audio...", fileData);
  const formData = new FormData();
  formData.append("file", new Blob([fileData]), "openai.wav");
  formData.append("model", "whisper-1");

  try {
    const response = await axiod.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer <TOKEN>`, // Replace <TOKEN> with your actual OpenAI token
          // Do not set Content-Type here, axiod will set it
        },
      }
    );
    console.log("Response:", response.data.text);
    return response.data.text;
  } catch (error) {
    console.error("Error:", error);
  }
}

const recordAudio = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  console.log("**** Code version 0.0.1 ****");

  // Read the binary data from the request body
  const audioData = new Uint8Array(await req.arrayBuffer());
  console.log("**************");
  console.info(audioData);
  console.log("**************");

  let transcript;
  try {
    transcript = await transcribe(audioData);
    console.log("Transcript:", transcript);
  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Respond with the transcription result
  return new Response(
    JSON.stringify({ message: "Audio transcribed successfully.", transcript }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
};

serve(recordAudio);
