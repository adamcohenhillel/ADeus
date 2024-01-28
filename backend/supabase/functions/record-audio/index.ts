import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders } from "../common/cors.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";
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

async function transcribe(fileData) {
  console.log("Transcribing audio...", fileData);
  const supabase = supabaseClient();
  // filename wavme, plus timestamp
  const filename_timestamp = `wavme_${Date.now()}.wav`;
  const { data, error } = await supabase.storage
    .from("test")
    .upload(filename_timestamp, fileData);

  if (error) {
    console.error("Error uploading file:", error);
  }

  const formData = new FormData();
  formData.append("file", new Blob([fileData]), "openai.wav");
  formData.append("model", "whisper-1");

  try {
    const response = await axiod.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`, // Replace <TOKEN> with your actual OpenAI token
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

  console.log("**** Code version 0.0.2 ****");

  // Read the binary data from the request body
  const audioData = new Uint8Array(await req.arrayBuffer());
  console.log("**************");
  console.info(audioData);
  console.log("**************");

  // Create WAV header
  // Assuming 48000 Hz sample rate, 2 channels (stereo), and 16 bits per sample
  const wavHeader = createWavHeader(audioData.length, 16000, 1, 32);
  const wavFile = new Uint8Array(wavHeader.length + audioData.length);
  wavFile.set(wavHeader, 0);
  wavFile.set(audioData, wavHeader.length);

  let transcript;
  try {
    transcript = await transcribe(wavFile);
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
