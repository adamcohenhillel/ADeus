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
int channels = 1;
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

void sendWav(const std::string &filePath)
{
    namespace fs = std::filesystem;

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

    // Use filesystem to get the file size
    auto fileSize = fs::file_size(filePath);
    if (fileSize == static_cast<uintmax_t>(-1))
    {
        std::cerr << "Could not determine file size: " << filePath << std::endl;
        return;
    }

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
        curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, static_cast<long>(fileSize));

        // Open file for reading in binary mode
        FILE *fd = fopen(filePath.c_str(), "rb");
        if (!fd)
        {
            std::cerr << "Failed to open file: " << filePath << std::endl;
            curl_easy_cleanup(curl);
            return;
        }
        curl_easy_setopt(curl, CURLOPT_READDATA, fd);
        curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L); // Enable verbose for testing

        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
            std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;

        // Cleanup
        fclose(fd);
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    curl_global_cleanup();
}

void writeWavHeader(std::ofstream &file, int bitsPerSample, int dataSize)
{
    file.write("RIFF", 4);
    int chunkSize = 36 + dataSize;
    file.write(reinterpret_cast<const char *>(&chunkSize), 4);
    file.write("WAVE", 4);
    file.write("fmt ", 4);
    int subchunk1Size = 16; // PCM
    file.write(reinterpret_cast<const char *>(&subchunk1Size), 4);
    short audioFormat = 1; // PCM
    file.write(reinterpret_cast<const char *>(&audioFormat), 2);
    file.write(reinterpret_cast<const char *>(&channels), 2);
    file.write(reinterpret_cast<const char *>(&sampleRate), 4);
    int byteRate = sampleRate * channels * bitsPerSample / 8;
    file.write(reinterpret_cast<const char *>(&byteRate), 4);
    short blockAlign = channels * bitsPerSample / 8;
    file.write(reinterpret_cast<const char *>(&blockAlign), 2);
    file.write(reinterpret_cast<const char *>(&bitsPerSample), 2);
    file.write("data", 4);
    file.write(reinterpret_cast<const char *>(&dataSize), 4);
}

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
            std::ofstream wavFile("output.wav", std::ios::binary);
            int bitsPerSample = 32;
            int dataSize = dataChunk.size();
            writeWavHeader(wavFile, bitsPerSample, dataSize);
            wavFile.write(dataChunk.data(), dataSize);
            wavFile.close();

            // Send the WAV file to the server
            sendWav("output.wav");

            // Delete the file after sending
            std::filesystem::remove("output.wav");
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