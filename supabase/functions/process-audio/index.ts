import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI, { toFile } from "https://deno.land/x/openai@v4.26.0/mod.ts";

import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";

function createWavHeader(dataLength, sampleRate, numChannels, bitDepth) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function writeUint32(view, offset, value) {
    view.setUint32(offset, value, true);
  }

  function writeUint16(view, offset, value) {
    view.setUint16(offset, value, true);
  }

  writeString(view, 0, "RIFF"); // RIFF Header
  writeUint32(view, 4, 36 + dataLength); // RIFF Chunk Size
  writeString(view, 8, "WAVE"); // WAVE Header
  writeString(view, 12, "fmt "); // FMT sub-chunk
  writeUint32(view, 16, 16); // FMT sub-chunk size (16 for PCM)
  writeUint16(view, 20, 1); // Audio Format (1 for PCM)
  writeUint16(view, 22, numChannels); // Number of channels
  writeUint32(view, 24, sampleRate); // Sample rate
  writeUint32(view, 28, (sampleRate * numChannels * bitDepth) / 8); // Byte Rate
  writeUint16(view, 32, (numChannels * bitDepth) / 8); // Block align
  writeUint16(view, 34, bitDepth); // Bits per sample
  writeString(view, 36, "data"); // "data" sub-chunk
  writeUint32(view, 40, dataLength); // Data sub-chunk size

  return new Uint8Array(header);
}

const processAudio = async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  const supabase = supabaseClient(req);

  const openaiClient = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });

  console.log("**** Code version 0.0.2 ****");

  // Read the binary data from the request body
  const audioData = new Uint8Array(await req.arrayBuffer());
  // Create WAV header
  // Assuming 16000 Hz sample rate, 1 channel, and 32 bits per sample
  const wavHeader = createWavHeader(audioData.length, 16000, 1, 32);
  const wavFile = new Uint8Array(wavHeader.length + audioData.length);
  wavFile.set(wavHeader, 0);
  wavFile.set(audioData, wavHeader.length);

  let transcript;
  let embeddings;
  try {
    const filenameTimestamp = `adeus_wav_${Date.now()}.wav`;

    // const { data, error } = await supabase.storage
    //   .from("test")
    //   .upload(filenameTimestamp, wavFile);

    // if (error) {
    //   console.error("Error uploading file:", error);
    // }

    const transcriptResponse = await openaiClient.audio.transcriptions.create({
      file: await toFile(wavFile, filenameTimestamp),
      model: "whisper-1",
      prompt:
        'If this audio file does not contain any speech, please return "None"',
    });
    transcript = transcriptResponse.text;
    let transcriptLowered = transcript.toLowerCase();
    // ("thank" in transcriptLowered &&
    //     "watch" in transcriptLowered &&
    //     "video" in transcriptLowered)
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

    const embeddingsResponse = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002",
      input: transcript.replace(/\n/g, " ").replace(/\s{2,}/g, " "),
    });
    embeddings = embeddingsResponse.data[0].embedding;
    console.log("Embeddings:", embeddings);

    const { data, error } = await supabase
      .from("records")
      .insert({ raw_text: transcript, embeddings: embeddings });

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

serve(processAudio);
