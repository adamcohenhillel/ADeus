import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import OpenAI, { toFile } from "https://deno.land/x/openai@v4.26.0/mod.ts";
import { decodeBase64 } from "https://deno.land/std@0.217.0/encoding/base64.ts";
import { corsHeaders } from "../common/cors";
import { supabaseClient } from "../common/supabaseClient";
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
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const supabase = supabaseClient(req);
    const openaiClient = new OpenAI({
        apiKey: Deno.env.get('OPENAI_API_KEY'),
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

      // 1 Channel, 8000 sample rate, 16 bit depth
      const wavHeader = createWavHeader(audioData.length, 8000, 1, 16);
      const wavBytes = new Uint8Array(wavHeader.length + audioData.length);
      wavBytes.set(wavHeader, 0);
      wavBytes.set(audioData, wavHeader.length);
      arrayBuffer = wavBytes.buffer;
    } else {
        arrayBuffer = await req.arrayBuffer();
    }

    let transcript: string;
    let embeddings: any;
    try {
        const filenameTimestamp = `adeus_wav_${Date.now()}.wav`;
        const wavFile = await toFile(arrayBuffer, filenameTimestamp);
        console.log(typeof wavFile, wavFile);


        const transcriptResponse =
            await openaiClient.audio.transcriptions.create({
                file: wavFile,
                model: 'whisper-1',
                prompt: 'If this audio file does not contain any speech, please return "None"',
            });
        transcript = transcriptResponse.text;
        let transcriptLowered = transcript.toLowerCase();
        
        if (
            transcript == 'None' ||
            transcript == '' ||
            transcript == null ||
            (transcriptLowered.includes('thank') &&
                transcriptLowered.includes('watch'))
        ) {
            return new Response(
                JSON.stringify({ message: 'No transcript found.' }),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                    status: 200,
                }
            );
        }

        console.log('Transcript:', transcript);

        const embeddingsResponse = await openaiClient.embeddings.create({
            model: 'text-embedding-ada-002',
            input: transcript.replace(/\n/g, ' ').replace(/\s{2,}/g, ' '),
        });
        embeddings = embeddingsResponse.data[0].embedding;
        console.log('Embeddings:', embeddings);

        const { data, error } = await supabase
            .from('records')
            .insert({ raw_text: transcript, embeddings: embeddings });

        if (error) {
            console.error('Error inserting record:', error);
        }
    } catch (error) {
        console.error('Transcription error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    return new Response(
        JSON.stringify({
            message: 'Audio transcribed successfully.',
            transcript,
        }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        }
    );
};

serve(processAudio);
