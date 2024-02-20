import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import OpenAI from 'https://deno.land/x/openai@v4.26.0/mod.ts';
import { corsHeaders } from '../common/cors.ts';
import { supabaseClient } from '../common/supabaseClient.ts';

const processTranscripts = async (req: Request) => {
    try {
        const supabase = supabaseClient(req);
        const openaiClient = new OpenAI({
            apiKey: Deno.env.get('OPENAI_API_KEY')!,
        });

        const { data, error } = await supabase
            .from('records')
            .select('raw_text')
            .eq('processed', false)
            .order('created_at', { ascending: true })
            .limit(5);

        if (error) {
            console.error('Error fetching records:', error);
            return new Response(
                JSON.stringify({ message: 'Error fetching records.' }),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                    status: 500,
                }
            );
        }

        // Create a broader context
        let concatenatedTranscripts: string;
        if (data.length > 0) {
            concatenatedTranscripts = data
                .map((record: any) => record.raw_text)
                .join(' ');
        } else {
            return new Response(
                JSON.stringify({ message: 'No records found.' }),
                {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                    status: 404,
                }
            );
        }

        console.log(concatenatedTranscripts);

        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4-0125-preview',
            messages: [
                {
                    role: 'system',
                    content: `
            These transcripts contain information about your user. 
            Your task is to organize the information in a way that makes sense to you.
            Your response must be in json format with the three following keys: "corrected_version", "summary", "topics".
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

        const responseData = JSON.parse(
            response.data.choices[0].message.content
        );
        console.log('Response Data:', responseData);

        const { summary, topics } = responseData;

        // Create meta data for each indivual transcript
        let transcript_and_metadata: Object = {};
        for (const record of data) {
            const response = await openaiClient.chat.completions.create({
                model: 'gpt-4-0125-preview',
                messages: [
                    {
                        role: 'system',
                        content: `
                        This is a transcript that contains information about your user.\n 
                        Your task is to organize the information in a way that makes sense to you.\n
                        Your response must be in json format with the three following keys: "verbose_version", "topics".
                        `,
                    },
                    {
                        role: 'user',
                        content: `${record.raw_text}\n\nGiven the information about the user,
                        provide a verbose version of the transcript, and the topics discussed\n.
                        *** Verbose version must include all the information in the original transcript, but in a more verbose manner.\n
                        *** Topics must be a list of topics that were discussed in the transcript, include topics not mentioned but that relate to the topics discussed.\n\n
                        `,
                    },
                ],
                response_format: { type: 'json_object' },
            });

            const responseData = JSON.parse(
                response.data.choices[0].message.content
            );
            console.log('Response Data:', responseData);

            transcript_and_metadata[record.id] = {
                raw_text: record.raw_text,
                verbose_version: responseData.verbose_version,
                topics: responseData.topics,
                summary: `This is an summary of the broader conversation so you have more context ${summary}`,
            };
        }

        // Embed the individual transcript with their metadata
        let flattenedData = '';
        for (const [id, metadata] of Object.entries(transcript_and_metadata)) {
            flattenedData += `Raw Text: ${
                metadata.raw_text
            }, Verbose Version: ${
                metadata.verbose_version
            }, Topics: ${metadata.topics.join(', ')} ${topics.join(
                ', '
            )}, Summary: ${metadata.summary}.`;

            const embeddingsResponse = await openaiClient.embeddings.create({
                model: 'text-embedding-3-small',
                input: flattenedData,
            });
            const embeddings = embeddingsResponse.data[0].embedding;
            console.log('Embeddings:', embeddings);

            const { data, error } = await supabase
            .from('embeddings')
            .insert({
                embedding: embeddings, 
                topics: metadata.topics,
                raw_text: metadata.raw_text,
                verbose_version: metadata.verbose_version,
                summary: metadata.summary,
            });

        if (error) {
            console.error('Error inserting record:', error);
        }
        }

    
        // Update the processed field for each record
        for (const record of data) {
            const { error: updateError } = await supabase
                .from('records')
                .update({ processed: true })
                .eq('id', record.id);

            if (updateError)
                throw new Error(
                    `Error updating record ${record.id}: ${updateError.message}`
                );
        }
    } catch (error) {
        console.error('Error processing transcripts:', error);
    }
};

serve(processTranscripts);