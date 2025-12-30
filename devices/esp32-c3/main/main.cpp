#include <Arduino.h>
#include "BLE/Server.h"
#include "esp_log.h"
#include <driver/i2s.h>
#include <stdlib.h>

BluetoothServer BLEServer;

// =================== AUDIO CONFIG ===================
#define BUFFER_SIZE 182
#define SAMPLE_RATE 8000

#define I2S_MIC_CHANNEL I2S_CHANNEL_FMT_ONLY_LEFT
#define I2S_MIC_SERIAL_CLOCK 3
#define I2S_MIC_LEFT_RIGHT_CLOCK 2
#define I2S_MIC_SERIAL_DATA 4

// =================== VAD CONFIG =====================
#define VAD_ENERGY_THRESHOLD 60000   // Tune this if needed
#define MIN_SPEECH_FRAMES 3           // Avoid noise spikes

static int speech_frames = 0;

// =================== I2S CONFIG =====================
i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = 1024,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
};

i2s_pin_config_t i2s_mic_pins = {
    .bck_io_num = I2S_MIC_SERIAL_CLOCK,
    .ws_io_num = I2S_MIC_LEFT_RIGHT_CLOCK,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_MIC_SERIAL_DATA
};

// =================== VAD FUNCTION ===================
bool has_speech(int16_t* samples, int count) {
    int64_t energy = 0;

    for (int i = 0; i < count; i++) {
        energy += abs(samples[i]);
    }

    return energy > VAD_ENERGY_THRESHOLD;
}

// =================== SETUP ==========================
void setup()
{
    ESP_LOGW("LOG", "Starting BLE Server");
    BLEServer.startAdvertising();
    ESP_LOGW("LOG", "BLE Server started");

    i2s_driver_install(I2S_NUM_0, &i2s_config, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &i2s_mic_pins);

    ESP_LOGW("LOG", "I2S initialized");
}

// =================== LOOP ===========================
uint8_t raw_samples[BUFFER_SIZE];

void loop()
{
    size_t bytes_read = 0;

    i2s_read(
        I2S_NUM_0,
        raw_samples,
        BUFFER_SIZE,
        &bytes_read,
        portMAX_DELAY
    );

    if (bytes_read == 0) return;

    int16_t* samples = (int16_t*)raw_samples;
    int sample_count = bytes_read / sizeof(int16_t);

    if (has_speech(samples, sample_count)) {
        speech_frames++;
    } else {
        speech_frames = 0;
    }

    // Require consecutive speech frames
    if (speech_frames < MIN_SPEECH_FRAMES) {
        return;   // 🚫 Silence → do not send BLE
    }

    // ✅ Speech detected → send over BLE
    BLEServer.setValue(raw_samples, bytes_read);
}
