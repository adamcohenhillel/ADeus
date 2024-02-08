#include <alsa/asoundlib.h>
#include <filesystem>
#include <string>
#include <cstdlib>
#include <iostream>
#include <fstream>
#include <vector>
#include <curl/curl.h>
#include <cassert>

void sendData(const std::string &filePath)
{
    namespace fs = std::filesystem;

    CURL *curl;
    CURLcode res;
    std::string url = getenv("SUPABASE_URL") + "/functions/v1/process-audio";
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

void writeWavHeader(std::ofstream &file, int sampleRate, int bitsPerSample, int channels, int dataSize)
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

int main()
{
    snd_pcm_t *capture_handle;
    snd_pcm_format_t format = SND_PCM_FORMAT_S32_LE;

    // Assuming 4 bytes per sample for S32_LE format and mono audio
    int bytesPerSample = 4;
    int channels = 1;
    unsigned int sampleRate = 48000;
    int durationInSeconds = 15; // Duration you want to accumulate before sending
    int targetBytes = sampleRate * durationInSeconds * bytesPerSample * channels;
    int rc;

    // Open PCM device for recording (capture)
    rc = snd_pcm_open(&capture_handle, "plughw:0", SND_PCM_STREAM_CAPTURE, 0);
    assert(rc >= 0);
    if (rc < 0)
    {
        std::cerr << "Unable to open pcm device: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    snd_pcm_uframes_t buffer_size;
    snd_pcm_uframes_t period_size;

    rc = snd_pcm_set_params(capture_handle,
                            format,
                            SND_PCM_ACCESS_RW_INTERLEAVED,
                            channels,
                            sampleRate,
                            1,       // allow software resampling
                            500000); // desired latency in microseconds (500ms)

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
    std::ofstream wavFile("output.wav", std::ios::binary);
    std::vector<char> accumulatedBuffer; // Accumulator for audio data

    while (accumulatedBuffer.size() < targetBytes)
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
                break; // Exit the loop once we have enough data
            }
        }
    }

    int bitsPerSample = 32;
    int dataSize = accumulatedBuffer.size();
    writeWavHeader(wavFile, sampleRate, bitsPerSample, channels, dataSize);
    wavFile.write(accumulatedBuffer.data(), dataSize);
    wavFile.close();
    sendData("output.wav");

    // Delete the file after sending
    std::filesystem::remove("output.wav");

    // Stop PCM device and drop pending frames
    snd_pcm_drop(capture_handle);

    // Close PCM device
    snd_pcm_close(capture_handle);

    return 0;
}