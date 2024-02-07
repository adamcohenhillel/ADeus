#include <alsa/asoundlib.h>
#include <cstdlib>
#include <iostream>
#include <fstream>
#include <vector>
#include <curl/curl.h>
#include <cassert>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>

std::mutex mtx;
std::condition_variable cv;
bool ready = false;
std::queue<std::vector<char>> dataQueue;

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

void sendDataThread() {
    std::unique_lock<std::mutex> lk(mtx);
    while (true) {
        cv.wait(lk, []{return ready;});
        while (!dataQueue.empty()) {
            std::vector<char> buffer = dataQueue.front();
            dataQueue.pop();
            // Now sendData without blocking the main thread
            sendData(buffer);
        }
        ready = false;
    }
}
int main() {
    snd_pcm_t *capture_handle;
    snd_pcm_hw_params_t *hw_params;
    snd_pcm_format_t format = SND_PCM_FORMAT_S32_LE;
    snd_pcm_uframes_t frames = 32;

    // Assuming 4 bytes per sample for S32_LE format and mono audio
    int bytesPerSample = 4;
    int channels = 1;
    unsigned int sampleRate = 48000; // Your sample rate
    int durationInSeconds = 15; // Duration you want to accumulate before sending
    int targetBytes = sampleRate * durationInSeconds * bytesPerSample * channels;
    int rc;
    int dir;

    // Open PCM device for recording (capture)
    rc = snd_pcm_open(&capture_handle, "plughw:0", SND_PCM_STREAM_CAPTURE, 0);
    assert(rc >= 0);
    if (rc < 0) {
        std::cerr << "Unable to open pcm device: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    // Allocate a hardware parameters object
    snd_pcm_hw_params_alloca(&hw_params);

    // Fill it in with default values
    snd_pcm_hw_params_any(capture_handle, hw_params);

    // Set the desired hardware parameters
    snd_pcm_hw_params_set_access(capture_handle, hw_params, SND_PCM_ACCESS_RW_INTERLEAVED);
    snd_pcm_hw_params_set_format(capture_handle, hw_params, format);
    snd_pcm_hw_params_set_channels(capture_handle, hw_params, channels);
    snd_pcm_hw_params_set_rate_near(capture_handle, hw_params, &sampleRate, &dir);
    snd_pcm_hw_params_set_period_size_near(capture_handle, hw_params, &frames, &dir);

    snd_pcm_uframes_t buffer_size = frames * 4; 
    rc = snd_pcm_hw_params_set_buffer_size_near(capture_handle, hw_params, &buffer_size);
    if (rc < 0) {
        std::cerr << "Unable to set buffer size: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    // Write the parameters to the driver
    rc = snd_pcm_hw_params(capture_handle, hw_params);
    if (rc < 0) {
        std::cerr << "Unable to set hw parameters: " << snd_strerror(rc) << std::endl;
        return 1;
    }

    // Prepare to use the capture handle
    snd_pcm_prepare(capture_handle);

    // Calculate buffer size
    int size = frames * channels * 4; // 4 bytes/sample for S32_LE

    int targetFrames = 48000 * 15; // 15 seconds of audio at 48000 Hz
    std::vector<char> accumulatedBuffer; // Accumulator for audio data

    std::thread worker(sendDataThread);

    while (true) { 
        // Temporary buffer for each read
        std::vector<char> buffer(size); // 'size' calculated based on your format and frames

        rc = snd_pcm_readi(capture_handle, buffer.data(), frames);
        if (rc == -EPIPE) {
            // Handle overrun
            std::cerr << "Overrun occurred" << std::endl;
            snd_pcm_prepare(capture_handle);
        } else if (rc < 0) {
            std::cerr << "Error from read: " << snd_strerror(rc) << std::endl;
        } else if (rc != (int)frames) {
            std::cerr << "Short read, read " << rc << " frames" << std::endl;
        } else {
            // Append the captured data to the accumulated buffer
            accumulatedBuffer.insert(accumulatedBuffer.end(), buffer.begin(), buffer.begin() + rc * sizeof(char)); // Assuming 1 byte per frame for simplicity

            if (accumulatedBuffer.size() >= targetBytes) {
            // Lock and update the queue
            {
                std::lock_guard<std::mutex> lk(mtx);
                dataQueue.push(accumulatedBuffer);
                accumulatedBuffer.clear(); // Clear the buffer for the next batch
            }
            ready = true;
            cv.notify_one();
        }
        }
    }

    // Stop PCM device and drop pending frames
    snd_pcm_drop(capture_handle);

    // Close PCM device
    snd_pcm_close(capture_handle);

    return 0;
}