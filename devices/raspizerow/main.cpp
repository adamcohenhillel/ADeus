#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <vector>
#include <iostream>
#include <fstream>
#include <alsa/asoundlib.h>
#include <curl/curl.h>
#include <filesystem>
#include <cassert>
#include <signal.h>
#include <atomic>

// Assuming 4 bytes per sample for S32_LE format and mono audio
int bytesPerSample = 4;
short channels = 1;
unsigned int sampleRate = 48000;
int durationInSeconds = 60; // Duration you want to accumulate before sending
int targetBytes = sampleRate * durationInSeconds * bytesPerSample * channels;
int rc;

template <typename T>
class SafeQueue
{
private:
    std::queue<T> queue;
    std::mutex mutex;
    std::condition_variable cond;

public:
    void push(T value)
    {
        std::lock_guard<std::mutex> lock(mutex);
        queue.push(value);
        cond.notify_one();
    }

    T pop()
    {
        std::unique_lock<std::mutex> lock(mutex);
        cond.wait(lock, [this]
                  { return !queue.empty(); });
        T value = queue.front();
        queue.pop();
        return value;
    }

    bool empty()
    {
        std::lock_guard<std::mutex> lock(mutex);
        return queue.empty();
    }
};
SafeQueue<std::vector<char>> audioQueue;

void recordAudio(snd_pcm_t *capture_handle, snd_pcm_uframes_t period_size)
{
    std::vector<char> buffer(period_size * bytesPerSample);
    std::vector<char> accumulatedBuffer;

    while (true)
    {
        rc = snd_pcm_readi(capture_handle, buffer.data(), period_size);
        if (rc == -EPIPE)
        {
            // Handle overrun
            std::cerr << "Overrun occurred" << std::endl;
            snd_pcm_prepare(capture_handle);
        }
        else if (rc < 0)
        {
            std::cerr << "Error from read: " << snd_strerror(rc) << std::endl;
            break; // Exit the loop on error
        }
        else if (rc != (int)period_size)
        {
            std::cerr << "Short read, read " << rc << " frames" << std::endl;
        }
        else
        {
            // Append the captured data to the accumulated buffer
            accumulatedBuffer.insert(accumulatedBuffer.end(), buffer.begin(), buffer.begin() + rc * bytesPerSample * channels);

            if (accumulatedBuffer.size() >= targetBytes)
            {
                audioQueue.push(accumulatedBuffer);
                accumulatedBuffer.clear();
            }
        }
    }
}

void createWavHeader(std::vector<char> &header, int bitsPerSample, int dataSize )
{
    // "RIFF" chunk descriptor
    header.insert(header.end(), {'R', 'I', 'F', 'F'});

    // Chunk size: 4 + (8 + SubChunk1Size) + (8 + SubChunk2Size)
    int chunkSize = 36 + dataSize;
    auto chunkSizeBytes = reinterpret_cast<const char *>(&chunkSize);
    header.insert(header.end(), chunkSizeBytes, chunkSizeBytes + 4);

    // Format
    header.insert(header.end(), {'W', 'A', 'V', 'E'});

    // "fmt " sub-chunk
    header.insert(header.end(), {'f', 'm', 't', ' '});

    // Sub-chunk 1 size (16 for PCM)
    int subchunk1Size = 16;
    auto subchunk1SizeBytes = reinterpret_cast<const char *>(&subchunk1Size);
    header.insert(header.end(), subchunk1SizeBytes, subchunk1SizeBytes + 4);

    // Audio format (PCM = 1)
    short audioFormat = 1;
    auto audioFormatBytes = reinterpret_cast<const char *>(&audioFormat);
    header.insert(header.end(), audioFormatBytes, audioFormatBytes + 2);

    // Number of channels
    auto channelsBytes = reinterpret_cast<const char *>(&channels);
    header.insert(header.end(), channelsBytes, channelsBytes + 2);

    // Sample rate
    auto sampleRateBytes = reinterpret_cast<const char *>(&sampleRate);
    header.insert(header.end(), sampleRateBytes, sampleRateBytes + 4);

    // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
    int byteRate = sampleRate * channels * bitsPerSample / 8;
    auto byteRateBytes = reinterpret_cast<const char *>(&byteRate);
    header.insert(header.end(), byteRateBytes, byteRateBytes + 4);

    // Block align (NumChannels * BitsPerSample/8)
    short blockAlign = channels * bitsPerSample / 8;
    auto blockAlignBytes = reinterpret_cast<const char *>(&blockAlign);
    header.insert(header.end(), blockAlignBytes, blockAlignBytes + 2);

    // Bits per sample
    auto bitsPerSampleBytes = reinterpret_cast<const char *>(&bitsPerSample);
    header.insert(header.end(), bitsPerSampleBytes, bitsPerSampleBytes + 2);

    // "data" sub-chunk
    header.insert(header.end(), {'d', 'a', 't', 'a'});

    // Sub-chunk 2 size (data size)
    auto dataSizeBytes = reinterpret_cast<const char *>(&dataSize);
    header.insert(header.end(), dataSizeBytes, dataSizeBytes + 4);
}

void sendWavBuffer(const std::vector<char> &buffer)
{
    CURL *curl;
    CURLcode res;
    const char *supabaseUrlEnv = getenv("SUPABASE_URL");
    if (!supabaseUrlEnv)
    {
        std::cerr << "Environment variable SUPABASE_URL is not set." << std::endl;
        return; // or handle the error as appropriate
    }

    std::string url = std::string(supabaseUrlEnv) + "/functions/v1/process-audio";
    std::string authToken = getenv("AUTH_TOKEN");

    // Initialize CURL
    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
    if (curl)
    {
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, ("Authorization: Bearer " + authToken).c_str());
        headers = curl_slist_append(headers, "Content-Type: audio/wav");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_POST, 1L);
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, static_cast<long>(buffer.size()));
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, buffer.data()); // Send buffer data directly

        curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L); // Enable verbose for testing

        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
            std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;

        // Cleanup
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    curl_global_cleanup();
}

void handleAudioBuffer()
{
    while (true)
    {
        std::vector<char> dataChunk;
        // Accumulate our target bytes
        while (dataChunk.size() < targetBytes)
        {
            std::vector<char> buffer = audioQueue.pop();
            dataChunk.insert(dataChunk.end(), buffer.begin(), buffer.end());
        }

        // Process and send the accumulated data
        if (!dataChunk.empty())
        {
            // Create the WAV header in memory
            std::vector<char> wavHeader;
            int bitsPerSample = 32;
            int dataSize = dataChunk.size();
            createWavHeader(wavHeader, bitsPerSample, dataSize);

            // Combine the header and the data into a single buffer
            std::vector<char> wavBuffer;
            wavBuffer.reserve(wavHeader.size() + dataSize);
            wavBuffer.insert(wavBuffer.end(), wavHeader.begin(), wavHeader.end());
            wavBuffer.insert(wavBuffer.end(), dataChunk.begin(), dataChunk.end());

            // Send the combined WAV buffer to the server
            sendWavBuffer(wavBuffer);
        }
    }
}

int main()
{
    snd_pcm_t *capture_handle;
    snd_pcm_format_t format = SND_PCM_FORMAT_S32_LE;

    // Open PCM device for recording
    rc = snd_pcm_open(&capture_handle, "plughw:0", SND_PCM_STREAM_CAPTURE, 0);
    assert(rc >= 0);
    if (rc < 0)
    {
        std::cerr << "Unable to open pcm device: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    // Set PCM parameters
    snd_pcm_uframes_t buffer_size;
    snd_pcm_uframes_t period_size;

    rc = snd_pcm_set_params(capture_handle,
                            format,
                            SND_PCM_ACCESS_RW_INTERLEAVED,
                            channels,
                            sampleRate,
                            1,       // allow software resampling
                            500000); // desired latency

    if (rc < 0)
    {
        std::cerr << "Setting PCM parameters failed: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    // After calling snd_pcm_set_params, you can query the actual buffer size and period size set by ALSA
    snd_pcm_get_params(capture_handle, &buffer_size, &period_size);
    std::vector<char> buffer(period_size * bytesPerSample);

    // Prepare to use the capture handle
    snd_pcm_prepare(capture_handle);

    // Start the recording thread
    std::thread recordingThread(recordAudio, capture_handle, period_size);

    // Start the sending thread
    std::thread sendingThread(handleAudioBuffer);

    recordingThread.join();
    sendingThread.join();

    // Stop PCM device and drop pending frames
    snd_pcm_drop(capture_handle);

    // Close PCM device
    snd_pcm_close(capture_handle);

    return 0;
}