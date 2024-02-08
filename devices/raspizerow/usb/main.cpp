#include <iostream>
#include <vector>
#include <portaudio.h>
#include <curl/curl.h>
#include <cstdlib> // For accessing environment variables
#include <cstring>
#include <fstream>

// Configuration
const int SAMPLE_RATE = 44100;
const int FRAMES_PER_BUFFER = 1024;
const int NUM_CHANNELS = 1;
const PaSampleFormat SAMPLE_FORMAT = paInt16;
const int RECORD_SECONDS = 5;

// Initialize PortAudio
PaError initAudio(PaStream **stream)
{
    PaError err = Pa_Initialize();
    if (err != paNoError)
        return err;

    err = Pa_OpenDefaultStream(stream, NUM_CHANNELS, NUM_CHANNELS, SAMPLE_FORMAT, SAMPLE_RATE, FRAMES_PER_BUFFER, nullptr, nullptr);
    return err;
}

// Start Recording
void recordAudio(PaStream *stream, std::vector<char> &buffer)
{
    Pa_StartStream(stream);
    std::cout << "Recording..." << std::endl;

    for (int i = 0; i < SAMPLE_RATE / FRAMES_PER_BUFFER * RECORD_SECONDS; ++i)
    {
        char data[FRAMES_PER_BUFFER * NUM_CHANNELS * sizeof(short)];
        Pa_ReadStream(stream, data, FRAMES_PER_BUFFER);
        buffer.insert(buffer.end(), data, data + sizeof(data));
    }

    Pa_StopStream(stream);
}

// Send Data
void sendData(std::vector<char> &buffer)
{
    CURL *curl;
    CURLcode res;
    std::string url = std::getenv("SUPABASE_URL") + std::string("/functions/v1/process-audio");

    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
    if (curl)
    {
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, buffer.data());
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, buffer.size());

        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
            std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;

        curl_easy_cleanup(curl);
    }
    curl_global_cleanup();
}

int main()
{
    PaStream *stream;
    std::vector<char> audioBuffer;

    if (initAudio(&stream) != paNoError)
    {
        std::cerr << "Failed to initialize audio" << std::endl;
        return 1;
    }

    while (true)
    {
        recordAudio(stream, audioBuffer);
        sendData(audioBuffer);
        audioBuffer.clear();
    }

    Pa_CloseStream(stream);
    Pa_Terminate();

    return 0;
}
