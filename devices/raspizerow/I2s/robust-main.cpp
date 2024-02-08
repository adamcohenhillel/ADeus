#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <vector>
#include <iostream>
#include <fstream>
#include <alsa/asoundlib.h>
#include <cassert>

// Thread-safe queue
template <typename T>
class SafeQueue {
private:
    std::queue<T> queue;
    std::mutex mutex;
    std::condition_variable cond;

public:
    void push(T value) {
        std::lock_guard<std::mutex> lock(mutex);
        queue.push(value);
        cond.notify_one();
    }

    T pop() {
        std::unique_lock<std::mutex> lock(mutex);
        cond.wait(lock, [this] { return !queue.empty(); });
        T value = queue.front();
        queue.pop();
        return value;
    }

    bool empty() {
        std::lock_guard<std::mutex> lock(mutex);
        return queue.empty();
    }
};

// Global queue for audio data
SafeQueue<std::vector<char>> audioQueue;

// Function to record audio
void recordAudio(snd_pcm_t *capture_handle, int bytesPerSample, int channels, snd_pcm_uframes_t period_size) {
    std::vector<char> buffer(period_size * bytesPerSample);
    int rc;

    while (true) {
        rc = snd_pcm_readi(capture_handle, buffer.data(), period_size);
        // Handle errors and overruns as before...
        // If successful, push the data into the queue
        audioQueue.push(buffer);
    }
}

// Function to send audio data to the server
void sendDataToServer() {
    while (true) {
        std::vector<char> data = audioQueue.pop();
        // Send the data to the server...
    }
}

int main() {
    // Initialize ALSA and set up for recording as before...

    // Start the recording thread
    std::thread recordingThread(recordAudio, capture_handle, bytesPerSample, channels, period_size);

    // Start the sending thread
    std::thread sendingThread(sendDataToServer);

    // Join threads (or handle them appropriately, e.g., detach if they should run indefinitely)
    recordingThread.join();
    sendingThread.join();

    // Clean up ALSA resources as before...

    return 0;
}