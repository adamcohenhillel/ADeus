import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI, { toFile } from "https://deno.land/x/openai@v4.26.0/mod.ts";
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';

import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";

const transcribeAudio = async (req: Request) => {
  
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = supabaseClient(req);
  const openaiClient = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  const contentType = req.headers.get('Content-Type') || '';
    let arrayBuffer: ArrayBuffer;
    let filenameTimestamp = `audio_${Date.now()}.wav`;

    if (contentType.includes('multipart/form-data')) {
        const form = await multiParser(req);
        if (!form || !form.files || !form.files.file) {
            return new Response('File not found in form', {
                status: 400,
                headers: corsHeaders,
            });
        }
        console.log('Form:', form);
        const file = form.files.file;
        arrayBuffer = file.content.buffer;
        filenameTimestamp = file.filename || filenameTimestamp;
    } else {
        arrayBuffer = await req.arrayBuffer();
    }

  let transcript: string;
  try {
    const filenameTimestamp = `adeus_wav_${Date.now()}.wav`;
    const wavFile = await toFile(arrayBuffer, filenameTimestamp);

    const transcriptResponse = await openaiClient.audio.transcriptions.create({
      file: await toFile(wavFile, filenameTimestamp),
      model: "whisper-1",
      prompt:
        'Listen to the entire audio file, if no audio is detected then respond with "None" ',
    });
    transcript = transcriptResponse.text;
    let transcriptLowered = transcript.toLowerCase();

    if (
      transcript == "None" ||
      transcript == "" ||
      transcript == null ||
      (transcriptLowered.includes("thank") &&
        transcriptLowered.includes("watch"))
    ) {
      return new Response(JSON.stringify({ message: "No transcript found." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log("Transcript:", transcript);
  
    const { data, error } = await supabase
      .from("records")
      .insert({ raw_text: transcript,});

    if (error) {
      console.error("Error inserting record:", error);
    }
  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({ message: "Audio transcribed successfully.", transcript }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
};

serve(transcribeAudio);