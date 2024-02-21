import { serve } from 'https://deno.land/std/http/server.ts';
import { multiParser } from 'https://deno.land/x/multiparser@0.114.0/mod.ts';
import OpenAI, { toFile } from 'https://deno.land/x/openai@v4.26.0/mod.ts';

import { corsHeaders } from '../common/cors.ts';
import { supabaseClient } from '../common/supabaseClient.ts';

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
    } else {
        arrayBuffer = await req.arrayBuffer();
    }

    let transcript: string;
    let embeddings: any;
    try {
        const filenameTimestamp = `adeus_wav_${Date.now()}.wav`;
        const wavFile = await toFile(arrayBuffer, filenameTimestamp);
        console.log(typeof wavFile, wavFile);

        // const { data, error } = await supabase.storage
        //   .from("test")
        //   .upload(filenameTimestamp, wavFile);

        // if (error) {
        //   console.error("Error uploading file:", error);
        // }

        const transcriptResponse =
            await openaiClient.audio.transcriptions.create({
                file: wavFile,
                model: 'whisper-1',
                prompt: 'If this audio file does not contain any speech, please return "None"',
            });
        transcript = transcriptResponse.text;
        let transcriptLowered = transcript.toLowerCase();
        // ("thank" in transcriptLowered &&
        //     "watch" in transcriptLowered &&
        //     "video" in transcriptLowered)
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
