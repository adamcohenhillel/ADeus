#include <alsa/asoundlib.h>
#include <cstdlib>
#include <iostream>
#include <fstream>
#include <vector>
#include <curl/curl.h>
#include <cassert>

void sendData(std::vector<char> &buffer)
{
    CURL *curl;
    CURLcode res;
    std::string url = "https://cvctravnzlqjcasfrvzy.supabase.co/functions/v1/process-audio";

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

int main() {
    snd_pcm_t *capture_handle;
    snd_pcm_format_t format = SND_PCM_FORMAT_S32_LE;

    // Assuming 4 bytes per sample for S32_LE format and mono audio
    int bytesPerSample = 4;
    int channels = 1;
    unsigned int sampleRate = 48000; // Your sample rate
    int durationInSeconds = 15; // Duration you want to accumulate before sending
    int targetBytes = sampleRate * durationInSeconds * bytesPerSample * channels;
    int rc;

    // Open PCM device for recording (capture)
    rc = snd_pcm_open(&capture_handle, "plughw:0", SND_PCM_STREAM_CAPTURE, 0);
    assert(rc >= 0);
    if (rc < 0) {
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
                                1, // allow software resampling
                                500000); // desired latency in microseconds (500ms)

    if (rc < 0) {
        std::cerr << "Setting PCM parameters failed: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    // After calling snd_pcm_set_params, you can query the actual buffer size and period size set by ALSA
    snd_pcm_get_params(capture_handle, &buffer_size, &period_size);

    // Prepare to use the capture handle
    snd_pcm_prepare(capture_handle);

    std::vector<char> accumulatedBuffer; // Accumulator for audio data

    while (true) { 
        // Temporary buffer for each read
        std::vector<char> buffer(period_size * bytesPerSample * channels); // 'size' calculated based on your format and frames

        rc = snd_pcm_readi(capture_handle, buffer.data(), period_size);
        if (rc == -EPIPE) {
            // Handle overrun
            std::cerr << "Overrun occurred" << std::endl;
            snd_pcm_prepare(capture_handle);
        } else if (rc < 0) {
            std::cerr << "Error from read: " << snd_strerror(rc) << std::endl;
        } else if (rc != (int)period_size) {
            std::cerr << "Short read, read " << rc << " frames" << std::endl;
        } else {
            // Append the captured data to the accumulated buffer
            accumulatedBuffer.insert(accumulatedBuffer.end(), buffer.begin(), buffer.begin() + rc * sizeof(char)); // Assuming 1 byte per frame for simplicity

            if (accumulatedBuffer.size() >= targetBytes) {
                sendData(accumulatedBuffer);
                accumulatedBuffer.clear(); // Clear the buffer for the next batch
            }
        }
    }

    // Stop PCM device and drop pending frames
    snd_pcm_drop(capture_handle);

    // Close PCM device
    snd_pcm_close(capture_handle);

    return 0;
}