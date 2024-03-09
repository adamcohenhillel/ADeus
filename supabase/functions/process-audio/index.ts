import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI, { toFile } from "https://deno.land/x/openai@v4.26.0/mod.ts";
import { decodeBase64 } from "https://deno.land/std@0.217.0/encoding/base64.ts";
import { corsHeaders } from "../common/cors.ts";
import { supabaseClient } from "../common/supabaseClient.ts";
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';


function createWavHeader(dataLength: number, sampleRate: number, numChannels: number, bitDepth: number) {
  const headerLength = 44; // Fixed size for WAV header
  const buffer = new ArrayBuffer(headerLength);
  const view = new DataView(buffer);

  // Helper function to write a string to the DataView
  function writeString(view: DataView, offset: number, value: string) {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  }

  // Writes a 32-bit unsigned integer to the DataView
  function writeUint32(view: DataView, offset: number, value) {
    view.setUint32(offset, value, true);
  }

  // Writes a 16-bit unsigned integer to the DataView
  function writeUint16(view: DataView, offset: number, value) {
    view.setUint16(offset, value, true);
  }

  writeString(view, 0, "RIFF");
  writeUint32(view, 4, 36 + dataLength);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  writeUint32(view, 16, 16);
  writeUint16(view, 20, 1);
  writeUint16(view, 22, numChannels);
  writeUint32(view, 24, sampleRate);
  writeUint32(view, 28, sampleRate * numChannels * bitDepth / 8);
  writeUint16(view, 32, numChannels * bitDepth / 8);
  writeUint16(view, 34, bitDepth);
  writeString(view, 36, "data");
  writeUint32(view, 40, dataLength);

  return new Uint8Array(buffer);
}

const processAudio = async (req: Request) => {
  
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
    } else if (contentType.includes('application/json')) {
      const { data } = await req.json();
      const audioData = decodeBase64(data);

      console.log('Audio data:', audioData.length);
      // 1 Channel, 8000 sample rate, 16 bit depth
      const wavHeader = createWavHeader(audioData.length, 16000, 1, 16);
      const wavBytes = new Uint8Array(wavHeader.length + audioData.length);
      wavBytes.set(wavHeader, 0);
      wavBytes.set(audioData, wavHeader.length);
      arrayBuffer = wavBytes.buffer;
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
        'Listen to the entire audio file, if no audio is detected then respond with "None" ', // These types of prompts dont work well with Whisper -- https://platform.openai.com/docs/guides/speech-to-text/prompting
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

    const { data: unprocessedRecords, error: fetchError } = await supabase
    .from('records')
    .select('raw_text, id')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(4);

    if (fetchError) {
      console.error("Error fetching records:", fetchError);
      return new Response(JSON.stringify({ message: "Error fetching records." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  
    const insertResponse = await supabase
    .from("records")
    .insert([{ raw_text: transcript, processed: false }])
    .select();

    if (insertResponse.error) {
      console.error("Error inserting record:", insertResponse.error);
      return new Response(JSON.stringify({ message: "Error inserting record." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const currentTranscript = {
      raw_text: transcript,
      id: insertResponse.data[0].id,
    };

    const allRecordsToProcess = [...unprocessedRecords, currentTranscript];
    if (allRecordsToProcess.length === 5) {
      console.log("Processing new transcript with 4 unprocessed records...");
      let concatenatedTranscripts = unprocessedRecords
        .map((record: any) => record.raw_text)
        .join(" ");

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4-0125-preview',
        messages: [
            {
                role: 'system',
                content: `
        These transcripts contain information about your user. 
        Your task is to organize the information in a way that makes sense to you.
        Your response must be in json format with the three following keys: "summary", "topics".
        `,
            },
            {
                role: 'user',
                content: `${concatenatedTranscripts}\n\nGiven the information about the user, provide a summary, and the topics discussed.\n
        *** Summary must be a brief overview of the transcript.\n\n
        *** Topics must be a list of topics that were discussed in the transcript, include topics not mentioned but that relate to the topics discussed.\n\n
         `,
            },
        ],
        response_format: { type: 'json_object' },
      });
    
      const responseData = JSON.parse(response.choices[0].message.content);

      const { summary, topics } = responseData;
      
      allRecordsToProcess.forEach(async (record: any) => {
          const flattenedData: string = `Raw Text: ${record.raw_text}, This is an summary of the broader conversation so you have more context ${summary}, and Topics pertaining to the conversation ${topics}`;
          const embeddingsReponse = await openaiClient.embeddings.create({
            model: 'text-embedding-3-small',
            input: flattenedData,
          })

          const embeddings = embeddingsReponse.data[0].embedding;
          console.log("Embeddings:", embeddings);

          const updateResponse = await supabase
            .from('records')
            .update({ processed: true, summary, topics, embeddings })
            .eq('id', record.id);

          if (updateResponse.error) {
            console.error("Error updating record:", updateResponse.error);
            return new Response(JSON.stringify({ message: "Error updating record." }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500,
            });
          }
      });
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